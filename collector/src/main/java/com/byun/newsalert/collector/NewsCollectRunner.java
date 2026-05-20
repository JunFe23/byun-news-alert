package com.byun.newsalert.collector;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NewsCollectRunner implements CommandLineRunner {

    private final NewsCollectService newsCollectService;

    @Override
    public void run(String... args) {
        try {
            newsCollectService.collectOnce();
        } catch (Exception e) {
            log.error("뉴스 수집 실행 중 오류 발생", e);
            throw e;
        }
    }
}
