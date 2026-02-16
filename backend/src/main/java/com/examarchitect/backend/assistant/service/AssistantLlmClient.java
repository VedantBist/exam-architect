package com.examarchitect.backend.assistant.service;

import com.examarchitect.backend.assistant.dto.AssistantConversationTurnDto;
import java.util.List;
import java.util.Optional;

public interface AssistantLlmClient {

  Optional<AssistantLlmResponse> generateReply(
      String actorRole,
      String message,
      List<AssistantConversationTurnDto> history,
      String contextJson
  );
}
