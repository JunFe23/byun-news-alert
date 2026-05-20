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
        log.info("뉴스 수집 시작: mode={}, fromDate={}", mode, appProperties.getNews().getFromDate());

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
        Set<String> processedLinks = new HashSet<>();

        for (String query : queries) {
            log.info("watch 검색: query={}", query);
            NaverNewsResponse response = naverNewsClient.searchNews(query, display, 1);
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
        Set<String> processedLinks = new HashSet<>();

        for (FaPlayer player : players) {
            FaTeam team = player.getTeam();
            if (team == null) {
                log.warn("팀 정보 없음, 선수 스킵: playerId={}, name={}", player.getId(), player.getPlayerName());
                continue;
            }

            List<String> queries = List.of(
                    player.getPlayerName() + " FA",
                    player.getPlayerName() + " " + team.getShortName(),
                    player.getPlayerName() + " 프로농구"
            );

            for (String query : queries) {
                log.info("backfill 검색: player={}, query={}", player.getPlayerName(), query);
                int start = 1;
                boolean stopQuery = false;

                while (!stopQuery && start <= NAVER_MAX_START) {
                    NaverNewsResponse response = naverNewsClient.searchNews(query, display, start);
                    List<NaverNewsItem> items = itemsOrEmpty(response);
                    if (items.isEmpty()) {
                        break;
                    }

                    stats.fetched += items.size();
                    log.info("backfill API 결과: player={}, query={}, start={}, count={}",
                            player.getPlayerName(), query, start, items.size());

                    for (NaverNewsItem item : items) {
                        NewsTextUtils.ParsedArticle parsed = NewsTextUtils.parseArticle(item);
                        if (parsed.pubDate() != null && parsed.pubDate().isBefore(fromDate)) {
                            stopQuery = true;
                            log.info("fromDate 이전 기사 도달, 검색 중단: player={}, query={}, pubDate={}",
                                    player.getPlayerName(), query, parsed.pubDate());
                            break;
                        }
                        processItem(item, players, fromDate, "backfill", processedLinks, stats);
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
            return;
        }

        if (parsed.pubDate() == null || parsed.pubDate().isBefore(fromDate)) {
            return;
        }

        String text = NewsTextUtils.buildText(parsed.title(), parsed.description());
        List<FaPlayer> matchedPlayers = playerRelevanceService.findMatchingPlayers(text, players);
        if (matchedPlayers.isEmpty()) {
            return;
        }

        stats.relevant++;

        if (processedLinks.contains(parsed.link())) {
            NewsPersistenceService.SaveResult result =
                    newsPersistenceService.persist(parsed, matchedPlayers,
                            playerRelevanceService.collectMatchedKeywords(text, matchedPlayers),
                            mode);
            stats.mentionsAdded += result.mentionsAdded();
            return;
        }

        List<String> keywords = playerRelevanceService.collectMatchedKeywords(text, matchedPlayers);
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
        log.info("[{}] API 조회 {}건, 관련 {}건, 신규 저장 {}건, 알림 {}건, 멘션 추가 {}건",
                mode, stats.fetched, stats.relevant, stats.saved, stats.alerted, stats.mentionsAdded);
    }

    private static class CollectStats {
        int fetched;
        int relevant;
        int saved;
        int alerted;
        int mentionsAdded;
    }
}
