package com.examarchitect.backend.attempt.dto;

import java.util.Map;

public record UpdateAttemptRequest(
    Map<String, Object> answers,
    Map<String, Object> analytics
) {
}
