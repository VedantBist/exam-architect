package com.examarchitect.backend.assistant.dto;

import java.time.OffsetDateTime;
import java.util.List;

public record AssistantChatResponse(
    String mode,
    String reply,
    List<String> keyPoints,
    List<String> nextActions,
    OffsetDateTime generatedAt
) {
}
