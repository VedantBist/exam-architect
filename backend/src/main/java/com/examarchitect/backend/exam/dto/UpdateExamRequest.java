package com.examarchitect.backend.exam.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record UpdateExamRequest(
    String title,
    String description,

    @Min(value = 1, message = "Duration must be at least 1 minute")
    @Max(value = 480, message = "Duration cannot exceed 480 minutes")
    Integer durationMinutes,

    @Min(value = 0, message = "Passing percentage cannot be negative")
    @Max(value = 100, message = "Passing percentage cannot exceed 100")
    Integer passingPercentage,

    String status
) {
}
