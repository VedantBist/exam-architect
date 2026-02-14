package com.examarchitect.backend.exam.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateExamQuestionRequest(
    String id,

    @NotBlank(message = "Question text is required")
    String text,

    @NotBlank(message = "Question type is required")
    String type,

    @NotNull(message = "Question marks are required")
    @Min(value = 1, message = "Marks must be at least 1")
    Integer marks,

    Integer orderIndex,

    @Valid
    List<CreateExamOptionRequest> options,

    JsonNode correctAnswer
) {
}
