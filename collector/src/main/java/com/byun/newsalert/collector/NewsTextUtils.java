package com.byun.newsalert.collector;

import com.byun.newsalert.collector.dto.NaverNewsItem;
import org.jsoup.Jsoup;
import org.jsoup.parser.Parser;

import java.net.URI;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Optional;

public final class NewsTextUtils {

    private static final DateTimeFormatter NAVER_PUB_DATE_FORMAT =
            DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss Z", Locale.ENGLISH);

    private NewsTextUtils() {}

    public static String cleanHtml(String raw) {
        if (raw == null || raw.isBlank()) {
            return "";
        }
        return Jsoup.parse(raw, "", Parser.htmlParser()).text().trim();
    }

    public static String buildText(String title, String description) {
        return title + " " + description;
    }

    public static ParsedArticle parseArticle(NaverNewsItem item) {
        String title = cleanHtml(item.getTitle());
        String description = cleanHtml(item.getDescription());
        String link = item.getLink();
        String originalLink = blankToNull(item.getOriginallink());
        String publisher = extractPublisher(originalLink, link);
        OffsetDateTime pubDate = parsePubDate(item.getPubDate()).orElse(null);

        return new ParsedArticle(title, description, link, originalLink, publisher, pubDate);
    }

    public static Optional<OffsetDateTime> parsePubDate(String pubDate) {
        if (pubDate == null || pubDate.isBlank()) {
            return Optional.empty();
        }
        try {
            ZonedDateTime zoned = ZonedDateTime.parse(pubDate.trim(), NAVER_PUB_DATE_FORMAT);
            return Optional.of(zoned.toOffsetDateTime());
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public static String extractPublisher(String originalLink, String link) {
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

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    public record ParsedArticle(
            String title,
            String description,
            String link,
            String originalLink,
            String publisher,
            OffsetDateTime pubDate
    ) {}
}
