package com.byun.newsalert.collector;

import com.byun.newsalert.config.AppProperties;
import com.byun.newsalert.news.NewsItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramAlertService {

    private static final DateTimeFormatter PUB_DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss XXX");

    private final WebClient webClient;
    private final AppProperties appProperties;

    public boolean sendAlert(NewsItem item) {
        String message = buildMessage(item);
        String botToken = appProperties.getTelegram().getBotToken();
        String chatId = appProperties.getTelegram().getChatId();
        String url = "https://api.telegram.org/bot" + botToken + "/sendMessage";

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("chat_id", chatId);
        form.add("text", message);
        form.add("disable_web_page_preview", "false");

        try {
            webClient.post()
                    .uri(url)
                    .body(BodyInserters.fromFormData(form))
                    .retrieve()
                    .toBodilessEntity()
                    .block();
            return true;
        } catch (WebClientResponseException e) {
            log.error("Telegram 알림 발송 실패: link={}, status={}, body={}",
                    item.getLink(), e.getStatusCode(), e.getResponseBodyAsString());
            return false;
        } catch (Exception e) {
            log.error("Telegram 알림 발송 중 오류: link={}", item.getLink(), e);
            return false;
        }
    }

    private String buildMessage(NewsItem item) {
        String keywords = item.getMatchedKeywords() == null
                ? ""
                : Arrays.stream(item.getMatchedKeywords()).collect(Collectors.joining(", "));
        String pubDate = item.getPubDate() == null
                ? "알 수 없음"
                : item.getPubDate().format(PUB_DATE_FORMAT);

        return """
                🏀 변준형 FA 새 뉴스

                [제목]
                %s

                매칭 키워드: %s
                발행일: %s

                %s
                """.formatted(item.getTitle(), keywords, pubDate, item.getLink()).strip();
    }
}
