package com.examarchitect.backend.stats.dto;

public record ExamStatsDto(
    long totalExams,
    long activeExams,
    long totalAttempts,
    long submittedAttempts
) {
}
