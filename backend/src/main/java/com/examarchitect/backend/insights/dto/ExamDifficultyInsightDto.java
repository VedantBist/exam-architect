package com.examarchitect.backend.insights.dto;

public record ExamDifficultyInsightDto(
    String examId,
    String examTitle,
    long attempts,
    double averagePercentage,
    double passRate
) {
}
