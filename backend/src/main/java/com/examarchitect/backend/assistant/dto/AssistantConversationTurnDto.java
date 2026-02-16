package com.examarchitect.backend.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AssistantConversationTurnDto(
    @NotBlank(message = "Role is required")
    @Size(max = 20, message = "Role is too long")
    String role,

    @NotBlank(message = "Content is required")
    @Size(max = 2000, message = "Content is too long")
    String content
) {
}
