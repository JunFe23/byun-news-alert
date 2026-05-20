package com.byun.newsalert.collector;

import com.byun.newsalert.collector.dto.NaverNewsResponse;
import com.byun.newsalert.config.AppProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

@Slf4j
@Component
@RequiredArgsConstructor
public class NaverNewsClient {

    private static final String NAVER_NEWS_URL = "https://openapi.naver.com/v1/search/news.json";

    private final WebClient webClient;
    private final AppProperties appProperties;

    public NaverNewsResponse fetchNews() {
        AppProperties.News news = appProperties.getNews();
        AppProperties.Naver naver = appProperties.getNaver();

        try {
            NaverNewsResponse response = webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .scheme("https")
                            .host("openapi.naver.com")
                            .path("/v1/search/news.json")
                            .queryParam("query", news.getQuery())
                            .queryParam("display", news.getDisplay())
                            .queryParam("sort", news.getSort())
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
        } catch (WebClientResponseException e) {
            log.error("네이버 뉴스 API 호출 실패: status={}, body={}", e.getStatusCode(), e.getResponseBodyAsString());
            throw e;
        } catch (Exception e) {
            log.error("네이버 뉴스 API 호출 중 오류 발생", e);
            throw e;
        }
    }
}
