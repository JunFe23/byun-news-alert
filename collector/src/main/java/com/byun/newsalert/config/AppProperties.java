package com.byun.newsalert.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private final Naver naver = new Naver();
    private final Telegram telegram = new Telegram();
    private final News news = new News();

    @Getter
    @Setter
    public static class Naver {
        private String clientId;
        private String clientSecret;
    }

    @Getter
    @Setter
    public static class Telegram {
        private String botToken;
        private String chatId;
        /** Telegram 알림을 보낼 선수명 목록 (기본: 변준형) */
        private List<String> alertPlayerNames = new ArrayList<>(List.of("변준형"));
    }

    @Getter
    @Setter
    public static class News {
        /** watch | backfill */
        private String mode = "watch";
        private String fromDate = "2026-05-18";
        private String sort = "date";
        private final Watch watch = new Watch();
        private final Backfill backfill = new Backfill();
    }

    @Getter
    @Setter
    public static class Watch {
        private int display = 20;
        private List<String> queries = new ArrayList<>();
    }

    @Getter
    @Setter
    public static class Backfill {
        private int display = 100;
    }
}
