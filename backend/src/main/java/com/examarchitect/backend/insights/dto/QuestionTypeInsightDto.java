package com.examarchitect.backend.insights.dto;

public record QuestionTypeInsightDto(
    String type,
    long correct,
    long total,
    double accuracy
) {
}
