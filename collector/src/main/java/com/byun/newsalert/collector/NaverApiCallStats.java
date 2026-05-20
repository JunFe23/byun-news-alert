package com.byun.newsalert.collector;

/**
 * 네이버 뉴스 API 호출 통계 (수집 1회 실행 단위).
 */
public class NaverApiCallStats {

    private int apiCallCount;
    private int rateLimitRetryCount;
    private int rateLimitSkipCount;

    public void recordApiCall() {
        apiCallCount++;
    }

    public void recordRateLimitRetry() {
        rateLimitRetryCount++;
    }

    public void recordRateLimitSkip() {
        rateLimitSkipCount++;
    }

    public int getApiCallCount() {
        return apiCallCount;
    }

    public int getRateLimitRetryCount() {
        return rateLimitRetryCount;
    }

    public int getRateLimitSkipCount() {
        return rateLimitSkipCount;
    }
}
