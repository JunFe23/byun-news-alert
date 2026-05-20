package com.byun.newsalert.news;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NewsItemRepository extends JpaRepository<NewsItem, Long> {

    boolean existsByLink(String link);

    Optional<NewsItem> findByLink(String link);
}
