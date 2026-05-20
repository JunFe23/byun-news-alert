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

    private final WebClient webClient;
    private final AppProperties appProperties;

    public NaverNewsResponse searchNews(String query, int display, int start) {
        AppProperties.Naver naver = appProperties.getNaver();
        String sort = appProperties.getNews().getSort();

        try {
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
        } catch (WebClientResponseException e) {
            log.error(
                    "네이버 뉴스 API 호출 실패: query={}, start={}, status={}, body={}",
                    query,
                    start,
                    e.getStatusCode(),
                    e.getResponseBodyAsString()
            );
            throw e;
        } catch (Exception e) {
            log.error("네이버 뉴스 API 호출 중 오류: query={}, start={}", query, start, e);
            throw e;
        }
    }
}
