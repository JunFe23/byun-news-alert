package com.byun.newsalert.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

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
    }

    @Getter
    @Setter
    public static class News {
        private String query;
        private int display;
        private String sort;
    }
}
