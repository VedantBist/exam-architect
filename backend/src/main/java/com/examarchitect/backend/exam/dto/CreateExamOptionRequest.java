package com.examarchitect.backend.exam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateExamOptionRequest(
    String id,

    @NotBlank(message = "Option text is required")
    String text,

    @NotNull(message = "Option correctness is required")
    Boolean isCorrect,

    Integer orderIndex
) {
}
