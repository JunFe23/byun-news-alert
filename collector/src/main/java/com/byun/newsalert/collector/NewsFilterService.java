package com.byun.newsalert.collector;

import com.byun.newsalert.collector.dto.NaverNewsItem;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.parser.Parser;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Slf4j
@Service
public class NewsFilterService {

    private static final String REQUIRED_NAME = "변준형";
    private static final DateTimeFormatter NAVER_PUB_DATE_FORMAT =
            DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss Z", Locale.ENGLISH);

    private static final List<String> KEYWORDS = List.of(
            "FA", "계약", "이적", "잔류", "영입", "협상", "정관장",
            "KCC", "DB", "LG", "SK", "삼성", "현대모비스", "KT", "소노", "가스공사"
    );

    public record FilteredNews(
            String title,
            String description,
            String link,
            String originalLink,
            String publisher,
            OffsetDateTime pubDate,
            List<String> matchedKeywords
    ) {}

    public Optional<FilteredNews> filter(NaverNewsItem item) {
        String title = cleanHtml(item.getTitle());
        String description = cleanHtml(item.getDescription());

        if (!containsRequiredName(title, description)) {
            return Optional.empty();
        }

        List<String> matched = findMatchedKeywords(title, description);
        if (matched.isEmpty()) {
            return Optional.empty();
        }

        String link = item.getLink();
        if (link == null || link.isBlank()) {
            return Optional.empty();
        }

        OffsetDateTime pubDate = parsePubDate(item.getPubDate()).orElse(null);
        String originalLink = blankToNull(item.getOriginallink());
        String publisher = extractPublisher(originalLink, link);

        return Optional.of(new FilteredNews(
                title,
                description,
                link,
                originalLink,
                publisher,
                pubDate,
                matched
        ));
    }

    public String cleanHtml(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        return Jsoup.parse(raw, "", Parser.htmlParser()).text().trim();
    }

    private boolean containsRequiredName(String title, String description) {
        return title.contains(REQUIRED_NAME) || description.contains(REQUIRED_NAME);
    }

    private List<String> findMatchedKeywords(String title, String description) {
        String combined = title + " " + description;
        List<String> matched = new ArrayList<>();
        for (String keyword : KEYWORDS) {
            if (matchesKeyword(combined, keyword)) {
                matched.add(keyword);
            }
        }
        return matched;
    }

    private boolean matchesKeyword(String text, String keyword) {
        if (keyword.chars().allMatch(c -> c < 128)) {
            return text.toUpperCase(Locale.ROOT).contains(keyword.toUpperCase(Locale.ROOT));
        }
        return text.contains(keyword);
    }

    private Optional<OffsetDateTime> parsePubDate(String pubDate) {
        if (pubDate == null || pubDate.isBlank()) {
            return Optional.empty();
        }
        try {
            ZonedDateTime zoned = ZonedDateTime.parse(pubDate.trim(), NAVER_PUB_DATE_FORMAT);
            return Optional.of(zoned.toOffsetDateTime());
        } catch (Exception e) {
            log.warn("pubDate 파싱 실패: value={}", pubDate, e);
            return Optional.empty();
        }
    }

    private String extractPublisher(String originalLink, String link) {
        String source = originalLink != null ? originalLink : link;
        try {
            URI uri = URI.create(source);
            String host = uri.getHost();
            if (host != null && host.startsWith("www.")) {
                host = host.substring(4);
            }
            return host;
        } catch (Exception e) {
            return null;
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
