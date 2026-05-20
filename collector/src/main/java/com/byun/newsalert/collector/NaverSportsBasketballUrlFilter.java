package com.byun.newsalert.collector;

import java.net.URI;
import java.util.Locale;
import java.util.Set;

/**
 * 네이버 스포츠 농구 카테고리 URL만 저장 후보로 허용합니다.
 */
public final class NaverSportsBasketballUrlFilter {

    private static final Set<String> ALLOWED_HOSTS = Set.of(
            "m.sports.naver.com",
            "sports.naver.com",
            "sports.news.naver.com"
    );

    private static final String BASKETBALL_PATH_SEGMENT = "/basketball/";

    private NaverSportsBasketballUrlFilter() {}

    public static boolean isAllowedBasketballNaverSportsUrl(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        try {
            URI uri = URI.create(url.trim());
            String host = normalizeHost(uri.getHost());
            if (host == null || !ALLOWED_HOSTS.contains(host)) {
                return false;
            }
            String path = uri.getPath();
            if (path == null || path.isBlank()) {
                return false;
            }
            return path.toLowerCase(Locale.ROOT).contains(BASKETBALL_PATH_SEGMENT);
        } catch (Exception e) {
            return false;
        }
    }

    public static boolean isAllowedArticle(NewsTextUtils.ParsedArticle article) {
        if (article == null) {
            return false;
        }
        return isAllowedBasketballNaverSportsUrl(article.link())
                || isAllowedBasketballNaverSportsUrl(article.originalLink());
    }

    private static String normalizeHost(String host) {
        if (host == null || host.isBlank()) {
            return null;
        }
        String normalized = host.toLowerCase(Locale.ROOT);
        if (normalized.startsWith("www.")) {
            normalized = normalized.substring(4);
        }
        return normalized;
    }
}
