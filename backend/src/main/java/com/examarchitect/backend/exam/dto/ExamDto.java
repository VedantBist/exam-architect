package com.examarchitect.backend.exam.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record ExamDto(
    String id,
    String title,
    String description,
    Integer durationMinutes,
    Integer passingPercentage,
    String createdBy,
    String status,
    List<ExamQuestionDto> questions,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}
