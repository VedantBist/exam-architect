package com.examarchitect.backend.exam.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateExamRequest(
    String id,

    @NotBlank(message = "Title is required")
    String title,

    String description,

    @NotNull(message = "Duration is required")
    @Min(value = 1, message = "Duration must be at least 1 minute")
    @Max(value = 480, message = "Duration cannot exceed 480 minutes")
    Integer durationMinutes,

    @NotNull(message = "Passing percentage is required")
    @Min(value = 0, message = "Passing percentage cannot be negative")
    @Max(value = 100, message = "Passing percentage cannot exceed 100")
    Integer passingPercentage,

    @NotBlank(message = "Created by is required")
    String createdBy,

    String status,

    @Valid
    List<CreateExamQuestionRequest> questions
) {
}
