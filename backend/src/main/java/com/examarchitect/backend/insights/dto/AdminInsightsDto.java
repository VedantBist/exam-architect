package com.examarchitect.backend.insights.dto;

import java.util.List;

public record AdminInsightsDto(
    long submittedAttempts,
    long uniqueStudents,
    double averagePercentage,
    double passRate,
    List<AtRiskStudentInsightDto> atRiskStudents,
    List<ExamDifficultyInsightDto> hardestExams,
    List<DailyTrendInsightDto> recentDailyTrend,
    List<String> recommendations
) {
}
