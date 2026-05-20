package com.byun.newsalert.collector;

import com.byun.newsalert.collector.dto.NaverNewsResponse;

import java.util.Optional;

public record NaverSearchResult(Optional<NaverNewsResponse> response, boolean skippedDueToRateLimit) {

    public static NaverSearchResult success(NaverNewsResponse response) {
        return new NaverSearchResult(Optional.of(response), false);
    }

    public static NaverSearchResult rateLimitSkipped() {
        return new NaverSearchResult(Optional.empty(), true);
    }
}
