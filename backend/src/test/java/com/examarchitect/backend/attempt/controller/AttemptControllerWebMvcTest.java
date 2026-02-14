package com.examarchitect.backend.attempt.controller;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.examarchitect.backend.attempt.dto.StudentAttemptDto;
import com.examarchitect.backend.attempt.service.AttemptService;
import com.examarchitect.backend.auth.model.UserAccount;
import com.examarchitect.backend.common.api.ApiException;
import com.examarchitect.backend.common.security.AccessControlService;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AttemptController.class)
class AttemptControllerWebMvcTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private AttemptService attemptService;

  @MockBean
  private AccessControlService accessControlService;

  @Test
  void createAttemptShouldReturnValidationErrorForInvalidPayload() throws Exception {
    mockMvc.perform(post("/api/v1/attempts")
            .header("X-User-Id", "student-001")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"examId":"exam-001","studentId":"","studentName":"Student User"}
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
        .andExpect(jsonPath("$.details.studentId").exists());
  }

  @Test
  void getAttemptsShouldReturnForbiddenForDifferentStudentId() throws Exception {
    UserAccount actor = UserAccount.builder().id("student-001").role("student").build();
    when(accessControlService.requireStudent("student-001")).thenReturn(actor);
    doThrow(new ApiException(FORBIDDEN, "AUTH_FORBIDDEN", "You can only access your own records"))
        .when(accessControlService)
        .requireSameUser("student-002", actor);

    mockMvc.perform(get("/api/v1/attempts")
            .header("X-User-Id", "student-001")
            .param("studentId", "student-002"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("AUTH_FORBIDDEN"));
  }

  @Test
  void updateAttemptShouldReturnAttemptPayload() throws Exception {
    UserAccount actor = UserAccount.builder().id("student-001").role("student").build();
    when(accessControlService.requireStudent("student-001")).thenReturn(actor);
    when(attemptService.updateAttempt(eq("attempt-1"), org.mockito.ArgumentMatchers.any(), eq("student-001")))
        .thenReturn(new StudentAttemptDto(
            "attempt-1",
            "exam-001",
            "student-001",
            "Student User",
            java.util.Map.of("q1", "m/s"),
            0,
            3,
            BigDecimal.ZERO,
            "in-progress",
            OffsetDateTime.parse("2026-02-14T10:00:00Z"),
            null
        ));

    mockMvc.perform(patch("/api/v1/attempts/attempt-1")
            .header("X-User-Id", "student-001")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"answers":{"q1":"m/s"}}
                """))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.id").value("attempt-1"))
        .andExpect(jsonPath("$.status").value("in-progress"))
        .andExpect(jsonPath("$.answers.q1").value("m/s"));
  }
}
