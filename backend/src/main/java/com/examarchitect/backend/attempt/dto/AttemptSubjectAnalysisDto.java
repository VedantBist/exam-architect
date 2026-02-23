package com.examarchitect.backend.attempt.dto;

import java.math.BigDecimal;

public record AttemptSubjectAnalysisDto(
    String subject,
    Integer totalQuestions,
    Integer attemptedQuestions,
    Integer correctQuestions,
    Integer wrongQuestions,
    Integer unattemptedQuestions,
    Integer marksObtained,
    Integer totalMarks,
    BigDecimal marksPercentage,
    BigDecimal avgTimePerQuestionSeconds,
    BigDecimal avgTimePerAttemptedQuestionSeconds,
    BigDecimal totalTimeSpentSeconds
) {
}
