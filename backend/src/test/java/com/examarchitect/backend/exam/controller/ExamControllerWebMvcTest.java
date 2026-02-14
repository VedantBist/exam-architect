package com.examarchitect.backend.exam.controller;

import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.examarchitect.backend.auth.model.UserAccount;
import com.examarchitect.backend.common.api.ApiException;
import com.examarchitect.backend.common.security.AccessControlService;
import com.examarchitect.backend.exam.dto.ExamSummaryDto;
import com.examarchitect.backend.exam.service.ExamService;
import java.time.OffsetDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ExamController.class)
class ExamControllerWebMvcTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private ExamService examService;

  @MockBean
  private AccessControlService accessControlService;

  @Test
  void createExamShouldReturnValidationErrorForMissingTitle() throws Exception {
    mockMvc.perform(post("/api/v1/exams")
            .header("X-User-Id", "admin-001")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "durationMinutes": 60,
                  "passingPercentage": 40,
                  "createdBy": "admin-001",
                  "questions": []
                }
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
        .andExpect(jsonPath("$.details.title").exists());
  }

  @Test
  void createExamShouldReturnForbiddenWhenActorIsNotAdmin() throws Exception {
    when(accessControlService.requireAdmin("student-001"))
        .thenThrow(new ApiException(FORBIDDEN, "AUTH_FORBIDDEN", "Admin role is required"));

    mockMvc.perform(post("/api/v1/exams")
            .header("X-User-Id", "student-001")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {
                  "title": "Physics Test",
                  "durationMinutes": 60,
                  "passingPercentage": 40,
                  "createdBy": "admin-001",
                  "questions": []
                }
                """))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("AUTH_FORBIDDEN"))
        .andExpect(jsonPath("$.message").value("Admin role is required"));
  }

  @Test
  void getExamsShouldReturnSummaryPayload() throws Exception {
    when(accessControlService.requireAuthenticated("admin-001"))
        .thenReturn(UserAccount.builder().id("admin-001").role("admin").build());
    when(examService.getAllExams())
        .thenReturn(List.of(new ExamSummaryDto(
            "exam-001",
            "Physics Test",
            "Basic Physics Concepts and Problems",
            60,
            40,
            "admin-001",
            "active",
            OffsetDateTime.parse("2026-02-14T00:00:00Z"),
            OffsetDateTime.parse("2026-02-14T00:00:00Z")
        )));

    mockMvc.perform(get("/api/v1/exams").header("X-User-Id", "admin-001"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value("exam-001"))
        .andExpect(jsonPath("$[0].durationMinutes").value(60))
        .andExpect(jsonPath("$[0].passingPercentage").value(40))
        .andExpect(jsonPath("$[0].status").value("active"));
  }
}
