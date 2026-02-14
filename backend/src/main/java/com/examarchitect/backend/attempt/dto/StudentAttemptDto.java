package com.examarchitect.backend.attempt.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Map;

public record StudentAttemptDto(
    String id,
    String examId,
    String studentId,
    String studentName,
    Map<String, Object> answers,
    Integer score,
    Integer totalMarks,
    BigDecimal percentage,
    String status,
    OffsetDateTime startedAt,
    OffsetDateTime submittedAt
) {
}
