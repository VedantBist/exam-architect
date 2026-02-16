package com.examarchitect.backend.assistant.controller;

import com.examarchitect.backend.assistant.dto.AssistantChatRequest;
import com.examarchitect.backend.assistant.dto.AssistantChatResponse;
import com.examarchitect.backend.assistant.service.AssistantService;
import com.examarchitect.backend.auth.model.UserAccount;
import com.examarchitect.backend.common.security.AccessControlService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/assistant")
public class AssistantController {

  private final AssistantService assistantService;
  private final AccessControlService accessControlService;

  public AssistantController(AssistantService assistantService, AccessControlService accessControlService) {
    this.assistantService = assistantService;
    this.accessControlService = accessControlService;
  }

  @PostMapping("/chat")
  public ResponseEntity<AssistantChatResponse> chat(
      @Valid @RequestBody AssistantChatRequest request,
      @RequestHeader(name = "X-User-Id", required = false) String userId
  ) {
    UserAccount actor = accessControlService.requireAuthenticated(userId);
    if ("student".equals(actor.getRole()) && request.studentId() != null && !request.studentId().isBlank()) {
      accessControlService.requireSameUser(request.studentId(), actor);
    }

    return ResponseEntity.ok(assistantService.chat(actor, request));
  }
}
