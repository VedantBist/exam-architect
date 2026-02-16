package com.examarchitect.backend.insights.dto;

import java.util.List;

public record StudentInsightsDto(
    String studentId,
    String studentName,
    long submittedAttempts,
    double averagePercentage,
    double latestPercentage,
    double passRate,
    double predictedNextPercentage,
    String trend,
    QuestionTypeInsightDto strongestQuestionType,
    QuestionTypeInsightDto weakestQuestionType,
    List<RecentAttemptInsightDto> recentAttempts,
    List<String> recommendations
) {
}
