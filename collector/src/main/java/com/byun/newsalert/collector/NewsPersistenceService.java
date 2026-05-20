package com.byun.newsalert.collector;

import com.byun.newsalert.fa.FaPlayer;
import com.byun.newsalert.fa.NewsPlayerMention;
import com.byun.newsalert.fa.NewsPlayerMentionRepository;
import com.byun.newsalert.news.NewsItem;
import com.byun.newsalert.news.NewsItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class NewsPersistenceService {

    private final NewsItemRepository newsItemRepository;
    private final NewsPlayerMentionRepository newsPlayerMentionRepository;
    private final TelegramAlertService telegramAlertService;
    private final TelegramAlertPolicy telegramAlertPolicy;

    @Transactional
    public SaveResult persist(
            NewsTextUtils.ParsedArticle article,
            List<FaPlayer> matchedPlayers,
            List<String> matchedKeywords,
            String mode
    ) {
        if (article.link() == null || article.link().isBlank()) {
            return SaveResult.skipped();
        }

        Optional<NewsItem> existing = newsItemRepository.findByLink(article.link());
        if (existing.isPresent()) {
            int mentionsAdded = saveMentions(existing.get().getId(), matchedPlayers);
            return SaveResult.existing(mentionsAdded);
        }

        NewsItem entity = NewsItem.builder()
                .title(article.title())
                .description(article.description())
                .link(article.link())
                .originalLink(article.originalLink())
                .publisher(article.publisher())
                .pubDate(article.pubDate())
                .matchedKeywords(matchedKeywords.toArray(String[]::new))
                .alertSent(false)
                .build();

        NewsItem saved = newsItemRepository.save(entity);
        int mentionsAdded = saveMentions(saved.getId(), matchedPlayers);

        boolean alerted = false;
        if (telegramAlertPolicy.shouldSendTelegramAlert(mode, matchedPlayers)) {
            List<String> playerNames = matchedPlayers.stream()
                    .map(FaPlayer::getPlayerName)
                    .toList();
            if (telegramAlertService.sendAlert(saved, playerNames)) {
                saved.setAlertSent(true);
                newsItemRepository.save(saved);
                alerted = true;
                log.info("Telegram 알림 발송 완료: link={}", saved.getLink());
            } else {
                log.warn("Telegram 알림 발송 실패, is_alert_sent=false 유지: link={}", saved.getLink());
            }
        } else if ("watch".equalsIgnoreCase(mode)) {
            log.debug("Telegram 알림 대상 선수 없음, 알림 스킵: link={}", saved.getLink());
        }

        return SaveResult.saved(mentionsAdded, alerted);
    }

    private int saveMentions(Long newsItemId, List<FaPlayer> players) {
        int added = 0;
        for (FaPlayer player : players) {
            if (newsPlayerMentionRepository.existsByNewsItemIdAndPlayerId(newsItemId, player.getId())) {
                continue;
            }
            newsPlayerMentionRepository.save(NewsPlayerMention.builder()
                    .newsItemId(newsItemId)
                    .playerId(player.getId())
                    .build());
            added++;
        }
        return added;
    }

    public record SaveResult(boolean newlySaved, boolean alerted, int mentionsAdded) {
        static SaveResult skipped() {
            return new SaveResult(false, false, 0);
        }

        static SaveResult existing(int mentionsAdded) {
            return new SaveResult(false, false, mentionsAdded);
        }

        static SaveResult saved(int mentionsAdded, boolean alerted) {
            return new SaveResult(true, alerted, mentionsAdded);
        }
    }
}
