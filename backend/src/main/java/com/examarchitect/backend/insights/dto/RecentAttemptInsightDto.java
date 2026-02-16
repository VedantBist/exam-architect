package com.examarchitect.backend.insights.dto;

import java.time.OffsetDateTime;

public record RecentAttemptInsightDto(
    String attemptId,
    String examId,
    String examTitle,
    double percentage,
    boolean passed,
    OffsetDateTime submittedAt
) {
}
