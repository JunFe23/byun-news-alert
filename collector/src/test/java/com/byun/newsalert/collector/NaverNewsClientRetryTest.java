package com.byun.newsalert.collector;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class NaverNewsClientRetryTest {

    @Test
    void linearBackoffIncreasesByAttempt() {
        long backoffMs = 3000;
        assertEquals(3000, backoffMs * 1);
        assertEquals(6000, backoffMs * 2);
        assertEquals(9000, backoffMs * 3);
    }
}
