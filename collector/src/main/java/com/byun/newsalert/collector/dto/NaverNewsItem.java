package com.byun.newsalert.collector.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class NaverNewsItem {

    private String title;
    private String originallink;
    private String link;
    private String description;

    @JsonProperty("pubDate")
    private String pubDate;
}
