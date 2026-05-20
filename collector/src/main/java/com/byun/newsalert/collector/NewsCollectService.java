package com.byun.newsalert.collector;

import com.byun.newsalert.collector.dto.NaverNewsItem;
import com.byun.newsalert.collector.dto.NaverNewsResponse;
import com.byun.newsalert.config.AppProperties;
import com.byun.newsalert.fa.FaPlayer;
import com.byun.newsalert.fa.FaPlayerRepository;
import com.byun.newsalert.fa.FaTeam;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class NewsCollectService {

    private static final int NAVER_MAX_START = 1000;

    private final AppProperties appProperties;
    private final NaverNewsClient naverNewsClient;
    private final FaPlayerRepository faPlayerRepository;
    private final PlayerRelevanceService playerRelevanceService;
    private final NewsPersistenceService newsPersistenceService;

    public void collectOnce() {
        String mode = appProperties.getNews().getMode();
        AppProperties.Naver naver = appProperties.getNaver();
        log.info(
                "뉴스 수집 시작: mode={}, fromDate={}, naverDelayMs={}, naverMaxRetries={}, naverRetryBackoffMs={}",
                mode,
                appProperties.getNews().getFromDate(),
                naver.getRequestDelayMs(),
                naver.getMaxRetries(),
                naver.getRetryBackoffMs()
        );

        if ("backfill".equalsIgnoreCase(mode)) {
            collectBackfill();
        } else {
            collectWatch();
        }

        log.info("뉴스 수집 완료");
    }

    private void collectWatch() {
        List<FaPlayer> players = faPlayerRepository.findAllWithTeam();
        if (players.isEmpty()) {
            log.warn("fa_players가 비어 있습니다. seed SQL을 먼저 적용하세요.");
            return;
        }

        OffsetDateTime fromDate = resolveFromDateTime();
        List<String> queries = appProperties.getNews().getWatch().getQueries();
        int display = appProperties.getNews().getWatch().getDisplay();

        CollectStats stats = new CollectStats();
        NaverApiCallStats naverStats = stats.naverStats;
        Set<String> processedLinks = new HashSet<>();

        for (String query : queries) {
            log.info("watch 검색: query={}", query);
            NaverSearchResult searchResult = naverNewsClient.searchNews(query, display, 1, naverStats);
            if (searchResult.skippedDueToRateLimit()) {
                log.warn("watch 검색 스킵 (429): query={}", query);
                continue;
            }
            NaverNewsResponse response = searchResult.response().orElseThrow();
            List<NaverNewsItem> items = itemsOrEmpty(response);
            stats.fetched += items.size();
            log.info("네이버 API 조회 결과: query={}, count={}", query, items.size());

            for (NaverNewsItem item : items) {
                processItem(item, players, fromDate, "watch", processedLinks, stats);
            }
        }

        logStats("watch", stats);
    }

    private void collectBackfill() {
        List<FaPlayer> players = faPlayerRepository.findAllWithTeam();
        if (players.isEmpty()) {
            log.warn("fa_players가 비어 있습니다. seed SQL을 먼저 적용하세요.");
            return;
        }

        OffsetDateTime fromDate = resolveFromDateTime();
        int display = appProperties.getNews().getBackfill().getDisplay();

        CollectStats stats = new CollectStats();
        NaverApiCallStats naverStats = stats.naverStats;
        Set<String> processedLinks = new HashSet<>();

        for (FaPlayer player : players) {
            FaTeam team = player.getTeam();
            if (team == null) {
                log.warn("팀 정보 없음, 선수 스킵: playerId={}, name={}", player.getId(), player.getPlayerName());
                continue;
            }

            List<String> queries = List.of(
                    player.getPlayerName() + " 프로농구",
                    player.getPlayerName() + " KBL",
                    player.getPlayerName() + " 농구",
                    player.getPlayerName() + " " + team.getShortName() + " 프로농구"
            );

            for (String query : queries) {
                log.info("backfill 검색: player={}, query={}", player.getPlayerName(), query);
                int start = 1;
                boolean stopQuery = false;

                while (!stopQuery && start <= NAVER_MAX_START) {
                    NaverSearchResult searchResult =
                            naverNewsClient.searchNews(query, display, start, naverStats);
                    if (searchResult.skippedDueToRateLimit()) {
                        log.warn(
                                "backfill 검색 스킵 (429): player={}, query={}, start={}",
                                player.getPlayerName(),
                                query,
                                start
                        );
                        break;
                    }
                    NaverNewsResponse response = searchResult.response().orElseThrow();
                    List<NaverNewsItem> items = itemsOrEmpty(response);
                    if (items.isEmpty()) {
                        break;
                    }

                    stats.fetched += items.size();
                    log.info("backfill API 결과: player={}, query={}, start={}, count={}",
                            player.getPlayerName(), query, start, items.size());

                    for (NaverNewsItem item : items) {
                        NewsTextUtils.ParsedArticle parsed = NewsTextUtils.parseArticle(item);
                        if (!NaverSportsBasketballUrlFilter.isAllowedArticle(parsed)) {
                            stats.skippedUrl++;
                            continue;
                        }
                        if (parsed.pubDate() != null && parsed.pubDate().isBefore(fromDate)) {
                            stopQuery = true;
                            log.info("fromDate 이전 기사 도달, 검색 중단: player={}, query={}, pubDate={}",
                                    player.getPlayerName(), query, parsed.pubDate());
                            break;
                        }
                        processParsed(parsed, players, "backfill", processedLinks, stats);
                    }

                    if (stopQuery || items.size() < display) {
                        break;
                    }
                    start += display;
                }
            }
        }

        logStats("backfill", stats);
    }

    private void processItem(
            NaverNewsItem item,
            List<FaPlayer> players,
            OffsetDateTime fromDate,
            String mode,
            Set<String> processedLinks,
            CollectStats stats
    ) {
        NewsTextUtils.ParsedArticle parsed = NewsTextUtils.parseArticle(item);
        if (parsed.link() == null || parsed.link().isBlank()) {
            stats.skippedInvalid++;
            return;
        }
        if (!NaverSportsBasketballUrlFilter.isAllowedArticle(parsed)) {
            stats.skippedUrl++;
            return;
        }
        if (parsed.pubDate() == null || parsed.pubDate().isBefore(fromDate)) {
            stats.skippedOld++;
            return;
        }
        processParsed(parsed, players, mode, processedLinks, stats);
    }

    private void processParsed(
            NewsTextUtils.ParsedArticle parsed,
            List<FaPlayer> players,
            String mode,
            Set<String> processedLinks,
            CollectStats stats
    ) {
        PlayerRelevanceService.MatchResult match =
                playerRelevanceService.matchPlayers(parsed.title(), parsed.description(), players);

        if (!match.hasMatches()) {
            switch (match.skipReason()) {
                case BASEBALL_CONTEXT, FINANCE_CORPORATE_CONTEXT, NO_BASKETBALL_CONTEXT ->
                        stats.skippedNoBasketball++;
                case NON_PLAYER_ROLE_PATTERN -> stats.skippedRolePattern++;
                case NO_PLAYER_MATCH -> {
                    stats.skippedNoPlayer++;
                    if (stats.skippedNoPlayer <= 20) {
                        log.debug("매칭 선수 0명으로 스킵: title={}", parsed.title());
                    }
                }
                default -> stats.skippedNoPlayer++;
            }
            return;
        }

        List<FaPlayer> matchedPlayers = match.matchedPlayers();

        stats.relevant++;

        if (processedLinks.contains(parsed.link())) {
            NewsPersistenceService.SaveResult result =
                    newsPersistenceService.persist(parsed, matchedPlayers,
                            playerRelevanceService.collectMatchedKeywords(match.cleanedText(), matchedPlayers),
                            mode);
            stats.mentionsAdded += result.mentionsAdded();
            if (result.mentionsAdded() > 0) {
                stats.existingLinked++;
            }
            return;
        }

        List<String> keywords = playerRelevanceService.collectMatchedKeywords(match.cleanedText(), matchedPlayers);
        NewsPersistenceService.SaveResult result =
                newsPersistenceService.persist(parsed, matchedPlayers, keywords, mode);

        processedLinks.add(parsed.link());
        if (result.newlySaved()) {
            stats.saved++;
            log.info("신규 뉴스 저장: link={}, title={}, players={}",
                    parsed.link(), parsed.title(), playerNames(matchedPlayers));
        }
        if (result.alerted()) {
            stats.alerted++;
        }
        stats.mentionsAdded += result.mentionsAdded();
    }

    private OffsetDateTime resolveFromDateTime() {
        LocalDate from = LocalDate.parse(appProperties.getNews().getFromDate());
        return from.atStartOfDay(ZoneOffset.of("+09:00")).toOffsetDateTime();
    }

    private List<NaverNewsItem> itemsOrEmpty(NaverNewsResponse response) {
        return response.getItems() == null ? List.of() : response.getItems();
    }

    private List<String> playerNames(List<FaPlayer> players) {
        return players.stream().map(FaPlayer::getPlayerName).toList();
    }

    private void logStats(String mode, CollectStats stats) {
        NaverApiCallStats naver = stats.naverStats;
        log.info(
                "[{}] naverAPI호출 {} | 429재시도 {} | 429스킵 {} | 뉴스 {}건 | fromDate제외 {} | URL제외 {} | 농구문맥없음 {} | 직함/기자제외 {} | 선수0 {} | 저장대상 {} | 신규저장 {} | 멘션+{} | 알림 {}",
                mode,
                naver.getApiCallCount(),
                naver.getRateLimitRetryCount(),
                naver.getRateLimitSkipCount(),
                stats.fetched,
                stats.skippedOld,
                stats.skippedUrl,
                stats.skippedNoBasketball,
                stats.skippedRolePattern,
                stats.skippedNoPlayer,
                stats.relevant,
                stats.saved,
                stats.mentionsAdded,
                stats.alerted
        );
    }

    private static class CollectStats {
        final NaverApiCallStats naverStats = new NaverApiCallStats();
        int fetched;
        int relevant;
        int saved;
        int alerted;
        int mentionsAdded;
        int skippedOld;
        int skippedNoPlayer;
        int skippedInvalid;
        int existingLinked;
        int skippedUrl;
        int skippedRolePattern;
        int skippedNoBasketball;
    }
}
