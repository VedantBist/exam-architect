package com.examarchitect.backend.attempt.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record AttemptAnalysisDto(
    String attemptId,
    String examId,
    String examTitle,
    Integer score,
    Integer totalMarks,
    BigDecimal percentage,
    String status,
    OffsetDateTime startedAt,
    OffsetDateTime submittedAt,
    List<AttemptSubjectAnalysisDto> subjects
) {
}
