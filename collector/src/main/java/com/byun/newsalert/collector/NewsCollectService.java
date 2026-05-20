package com.byun.newsalert.collector;

import com.byun.newsalert.collector.dto.NaverNewsItem;
import com.byun.newsalert.collector.dto.NaverNewsResponse;
import com.byun.newsalert.news.NewsItem;
import com.byun.newsalert.news.NewsItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NewsCollectService {

    private final NaverNewsClient naverNewsClient;
    private final NewsFilterService newsFilterService;
    private final NewsItemRepository newsItemRepository;
    private final TelegramAlertService telegramAlertService;

    @Transactional
    public void collectOnce() {
        log.info("뉴스 수집 시작");

        NaverNewsResponse response = naverNewsClient.fetchNews();
        List<NaverNewsItem> fetched = response.getItems() == null ? List.of() : response.getItems();
        log.info("네이버 API 조회 결과 개수: {}", fetched.size());

        List<NewsFilterService.FilteredNews> relevant = new ArrayList<>();
        for (NaverNewsItem item : fetched) {
            newsFilterService.filter(item).ifPresent(relevant::add);
        }
        log.info("관련 뉴스 개수: {}", relevant.size());

        int savedCount = 0;
        int alertCount = 0;

        for (NewsFilterService.FilteredNews filtered : relevant) {
            if (newsItemRepository.existsByLink(filtered.link())) {
                log.debug("이미 저장된 뉴스 건너뜀: link={}", filtered.link());
                continue;
            }

            NewsItem entity = NewsItem.builder()
                    .title(filtered.title())
                    .description(filtered.description())
                    .link(filtered.link())
                    .originalLink(filtered.originalLink())
                    .publisher(filtered.publisher())
                    .pubDate(filtered.pubDate())
                    .matchedKeywords(filtered.matchedKeywords().toArray(String[]::new))
                    .alertSent(false)
                    .build();

            NewsItem saved = newsItemRepository.save(entity);
            savedCount++;
            log.info("신규 뉴스 저장: link={}, title={}", saved.getLink(), saved.getTitle());

            if (telegramAlertService.sendAlert(saved)) {
                saved.setAlertSent(true);
                newsItemRepository.save(saved);
                alertCount++;
                log.info("Telegram 알림 발송 완료: link={}", saved.getLink());
            } else {
                log.warn("Telegram 알림 발송 실패, is_alert_sent=false 유지: link={}", saved.getLink());
            }
        }

        log.info("신규 저장 개수: {}", savedCount);
        log.info("알림 발송 개수: {}", alertCount);
        log.info("뉴스 수집 완료");
    }
}
