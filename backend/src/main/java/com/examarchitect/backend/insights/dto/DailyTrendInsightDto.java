package com.examarchitect.backend.insights.dto;

public record DailyTrendInsightDto(
    String date,
    long attempts,
    double averagePercentage,
    double passRate
) {
}
