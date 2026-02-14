package com.examarchitect.backend.common.api;

public record ApiError(String code, String message, Object details) {
}
