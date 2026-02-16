package com.examarchitect.backend.assistant.service;

import java.util.List;

public record AssistantLlmResponse(
    String reply,
    List<String> keyPoints,
    List<String> nextActions
) {
}
