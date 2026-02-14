package com.examarchitect.backend.exam.dto;

import java.time.OffsetDateTime;

public record ExamSummaryDto(
    String id,
    String title,
    String description,
    Integer durationMinutes,
    Integer passingPercentage,
    String createdBy,
    String status,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}
