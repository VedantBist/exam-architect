package com.examarchitect.backend.insights.dto;

public record AtRiskStudentInsightDto(
    String studentId,
    String studentName,
    long attempts,
    double averagePercentage,
    String trend
) {
}
