package com.byun.newsalert.news;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "news_items")
public class NewsItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(nullable = false, unique = true)
    private String link;

    @Column(name = "original_link")
    private String originalLink;

    private String publisher;

    @Column(name = "pub_date")
    private OffsetDateTime pubDate;

    @Column(name = "detected_at", insertable = false, updatable = false)
    private OffsetDateTime detectedAt;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "matched_keywords", columnDefinition = "text[]")
    private String[] matchedKeywords;

    @Column(name = "is_alert_sent")
    private boolean alertSent;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;
}
