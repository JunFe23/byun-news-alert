package com.byun.newsalert.news;

import org.springframework.data.jpa.repository.JpaRepository;

public interface NewsItemRepository extends JpaRepository<NewsItem, Long> {

    boolean existsByLink(String link);
}
