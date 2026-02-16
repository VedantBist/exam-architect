package com.examarchitect.backend.assistant.controller;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.examarchitect.backend.assistant.dto.AssistantChatRequest;
import com.examarchitect.backend.assistant.dto.AssistantChatResponse;
import com.examarchitect.backend.assistant.service.AssistantService;
import com.examarchitect.backend.auth.model.UserAccount;
import com.examarchitect.backend.common.api.ApiException;
import com.examarchitect.backend.common.security.AccessControlService;
import java.time.OffsetDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AssistantController.class)
class AssistantControllerWebMvcTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private AssistantService assistantService;

  @MockBean
  private AccessControlService accessControlService;

  @Test
  void chatShouldReturnValidationErrorForBlankMessage() throws Exception {
    mockMvc.perform(post("/api/v1/assistant/chat")
            .header("X-User-Id", "student-001")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"message":"   "}
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
        .andExpect(jsonPath("$.details.message").exists());
  }

  @Test
  void chatShouldRejectDifferentStudentContextForStudentActor() throws Exception {
    UserAccount actor = UserAccount.builder().id("student-001").role("student").build();
    when(accessControlService.requireAuthenticated("student-001")).thenReturn(actor);
    doThrow(new ApiException(FORBIDDEN, "AUTH_FORBIDDEN", "You can only access your own records"))
        .when(accessControlService)
        .requireSameUser("student-002", actor);

    mockMvc.perform(post("/api/v1/assistant/chat")
            .header("X-User-Id", "student-001")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"message":"How am I doing?","studentId":"student-002"}
                """))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("AUTH_FORBIDDEN"));
  }

  @Test
  void chatShouldReturnAssistantPayload() throws Exception {
    UserAccount actor = UserAccount.builder().id("student-001").role("student").build();
    when(accessControlService.requireAuthenticated("student-001")).thenReturn(actor);
    when(assistantService.chat(eq(actor), org.mockito.ArgumentMatchers.any(AssistantChatRequest.class)))
        .thenReturn(new AssistantChatResponse(
            "fallback",
            "You are improving.",
            List.of("Trend improving"),
            List.of("Practice integer questions"),
            OffsetDateTime.parse("2026-02-16T12:00:00Z")
        ));

    mockMvc.perform(post("/api/v1/assistant/chat")
            .header("X-User-Id", "student-001")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"message":"Give me my trend","studentId":"student-001"}
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.mode").value("fallback"))
        .andExpect(jsonPath("$.reply").value("You are improving."))
        .andExpect(jsonPath("$.keyPoints[0]").value("Trend improving"));
  }
}
