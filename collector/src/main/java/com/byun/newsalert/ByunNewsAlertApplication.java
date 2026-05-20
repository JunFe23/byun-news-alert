package com.byun.newsalert;

import com.byun.newsalert.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class ByunNewsAlertApplication {

    public static void main(String[] args) {
        SpringApplication.run(ByunNewsAlertApplication.class, args);
    }
}
