package com.examarchitect.backend.attempt.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateAttemptRequest(
    @NotBlank(message = "examId is required")
    String examId,

    @NotBlank(message = "studentId is required")
    String studentId,

    @NotBlank(message = "studentName is required")
    String studentName
) {
}
