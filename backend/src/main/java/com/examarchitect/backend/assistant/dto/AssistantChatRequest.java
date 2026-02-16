package com.examarchitect.backend.assistant.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record AssistantChatRequest(
    @NotBlank(message = "Message is required")
    @Size(max = 2000, message = "Message is too long")
    String message,

    @Size(max = 128, message = "Student id is too long")
    String studentId,

    @Valid
    @Size(max = 12, message = "History cannot exceed 12 turns")
    List<AssistantConversationTurnDto> history
) {
}
