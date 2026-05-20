package com.byun.newsalert.collector;

import com.byun.newsalert.collector.dto.NaverNewsResponse;
import com.byun.newsalert.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Slf4j
@Component
@RequiredArgsConstructor
public class NaverNewsClient {

    private final WebClient webClient;
    private final AppProperties appProperties;

    public NaverSearchResult searchNews(
            String query,
            int display,
            int start,
            NaverApiCallStats stats
    ) {
        AppProperties.Naver naver = appProperties.getNaver();
        applyRequestDelay(naver.getRequestDelayMs());

        int maxRetries = naver.getMaxRetries();
        long retryBackoffMs = naver.getRetryBackoffMs();

        for (int attempt = 0; attempt <= maxRetries; attempt++) {
            stats.recordApiCall();
            try {
                NaverNewsResponse response = executeSearch(query, display, start);
                applyRequestDelay(naver.getRequestDelayMs());
                return NaverSearchResult.success(response);
            } catch (WebClientResponseException e) {
                int status = e.getStatusCode().value();
                if (status == HttpStatus.UNAUTHORIZED.value() || status == HttpStatus.FORBIDDEN.value()) {
                    log.error(
                            "네이버 뉴스 API 인증 오류: query={}, start={}, status={}, body={}",
                            query,
                            start,
                            e.getStatusCode(),
                            e.getResponseBodyAsString()
                    );
                    throw new NaverApiAuthException("네이버 뉴스 API 인증 실패", e.getStatusCode());
                }
                if (status == HttpStatus.TOO_MANY_REQUESTS.value()) {
                    if (attempt < maxRetries) {
                        stats.recordRateLimitRetry();
                        long waitMs = retryBackoffMs * (attempt + 1L);
                        log.warn(
                                "429 TOO_MANY_REQUESTS — {}ms 후 재시도 ({}/{}): query={}, start={}",
                                waitMs,
                                attempt + 1,
                                maxRetries,
                                query,
                                start
                        );
                        sleep(waitMs);
                        applyRequestDelay(naver.getRequestDelayMs());
                        continue;
                    }
                    log.warn(
                            "429 TOO_MANY_REQUESTS — 재시도 소진, 검색 스킵: query={}, start={}",
                            query,
                            start
                    );
                    stats.recordRateLimitSkip();
                    return NaverSearchResult.rateLimitSkipped();
                }
                log.error(
                        "네이버 뉴스 API 호출 실패: query={}, start={}, status={}, body={}",
                        query,
                        start,
                        e.getStatusCode(),
                        e.getResponseBodyAsString()
                );
                throw e;
            } catch (NaverApiAuthException e) {
                throw e;
            } catch (Exception e) {
                log.error("네이버 뉴스 API 호출 중 오류: query={}, start={}", query, start, e);
                throw e;
            }
        }

        stats.recordRateLimitSkip();
        return NaverSearchResult.rateLimitSkipped();
    }

    private NaverNewsResponse executeSearch(String query, int display, int start) {
        AppProperties.Naver naver = appProperties.getNaver();
        String sort = appProperties.getNews().getSort();

        NaverNewsResponse response = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .scheme("https")
                        .host("openapi.naver.com")
                        .path("/v1/search/news.json")
                        .queryParam("query", query)
                        .queryParam("display", display)
                        .queryParam("start", start)
                        .queryParam("sort", sort)
                        .build())
                .header("X-Naver-Client-Id", naver.getClientId())
                .header("X-Naver-Client-Secret", naver.getClientSecret())
                .retrieve()
                .bodyToMono(NaverNewsResponse.class)
                .block();

        if (response == null) {
            throw new IllegalStateException("네이버 뉴스 API 응답이 비어 있습니다.");
        }
        return response;
    }

    private void applyRequestDelay(long delayMs) {
        if (delayMs <= 0) {
            return;
        }
        sleep(delayMs);
    }

    private void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("네이버 API 대기 중 인터럽트", e);
        }
    }
}
