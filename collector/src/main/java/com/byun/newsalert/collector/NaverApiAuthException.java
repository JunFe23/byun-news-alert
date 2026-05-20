package com.byun.newsalert.collector;

import org.springframework.http.HttpStatusCode;

public class NaverApiAuthException extends RuntimeException {

    public NaverApiAuthException(String message, HttpStatusCode statusCode) {
        super(message + " (HTTP " + statusCode.value() + ")");
    }
}
