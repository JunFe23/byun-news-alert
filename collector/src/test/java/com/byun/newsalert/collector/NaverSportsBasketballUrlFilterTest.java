package com.byun.newsalert.collector;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NaverSportsBasketballUrlFilterTest {

    @Test
    void allowsMobileBasketballArticle() {
        assertTrue(NaverSportsBasketballUrlFilter.isAllowedBasketballNaverSportsUrl(
                "https://m.sports.naver.com/basketball/article/076/0004407512"));
    }

    @Test
    void allowsDesktopBasketballHost() {
        assertTrue(NaverSportsBasketballUrlFilter.isAllowedBasketballNaverSportsUrl(
                "https://sports.naver.com/basketball/news/read?oid=076&aid=0004407512"));
    }

    @Test
    void allowsSportsNewsBasketballHost() {
        assertTrue(NaverSportsBasketballUrlFilter.isAllowedBasketballNaverSportsUrl(
                "https://sports.news.naver.com/basketball/article/076/0004407512"));
    }

    @Test
    void rejectsEsportsOnNaverSports() {
        assertFalse(NaverSportsBasketballUrlFilter.isAllowedBasketballNaverSportsUrl(
                "https://m.sports.naver.com/esports/article/109/0005536226"));
    }

    @Test
    void rejectsGeneralPressSite() {
        assertFalse(NaverSportsBasketballUrlFilter.isAllowedBasketballNaverSportsUrl(
                "https://www.kihoilbo.co.kr/news/articleView.html?idxno=3023149"));
    }

    @Test
    void rejectsBaseballCategory() {
        assertFalse(NaverSportsBasketballUrlFilter.isAllowedBasketballNaverSportsUrl(
                "https://m.sports.naver.com/baseball/article/109/0005536226"));
    }

    @Test
    void allowsWhenOriginalLinkIsBasketballEvenIfLinkIsNot() {
        NewsTextUtils.ParsedArticle article = new NewsTextUtils.ParsedArticle(
                "title",
                "desc",
                "https://n.news.naver.com/mnews/article/076/0004407512",
                "https://m.sports.naver.com/basketball/article/076/0004407512",
                "n.news.naver.com",
                null
        );
        assertTrue(NaverSportsBasketballUrlFilter.isAllowedArticle(article));
    }

    @Test
    void rejectsWhenNeitherLinkNorOriginalLinkIsBasketballSports() {
        NewsTextUtils.ParsedArticle article = new NewsTextUtils.ParsedArticle(
                "title",
                "desc",
                "https://n.news.naver.com/mnews/article/076/0004407512",
                "https://www.kihoilbo.co.kr/news/articleView.html?idxno=3023149",
                "kihoilbo.co.kr",
                null
        );
        assertFalse(NaverSportsBasketballUrlFilter.isAllowedArticle(article));
    }
}
