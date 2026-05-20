package com.byun.newsalert.collector.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class NaverNewsResponse {

    private int total;
    private int start;
    private int display;
    private List<NaverNewsItem> items = new ArrayList<>();
}
