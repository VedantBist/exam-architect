package com.examarchitect.backend.insights.controller;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.FORBIDDEN;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.examarchitect.backend.auth.model.UserAccount;
import com.examarchitect.backend.common.api.ApiException;
import com.examarchitect.backend.common.security.AccessControlService;
import com.examarchitect.backend.insights.dto.AdminInsightsDto;
import com.examarchitect.backend.insights.dto.DailyTrendInsightDto;
import com.examarchitect.backend.insights.dto.QuestionTypeInsightDto;
import com.examarchitect.backend.insights.dto.RecentAttemptInsightDto;
import com.examarchitect.backend.insights.dto.StudentInsightsDto;
import com.examarchitect.backend.insights.service.InsightsService;
import java.time.OffsetDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(InsightsController.class)
class InsightsControllerWebMvcTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private InsightsService insightsService;

  @MockBean
  private AccessControlService accessControlService;

  @Test
  void studentInsightsShouldRejectDifferentStudentActor() throws Exception {
    UserAccount actor = UserAccount.builder().id("student-001").role("student").build();
    when(accessControlService.requireAuthenticated("student-001")).thenReturn(actor);
    doThrow(new ApiException(FORBIDDEN, "AUTH_FORBIDDEN", "You can only access your own records"))
        .when(accessControlService)
        .requireSameUser("student-002", actor);

    mockMvc.perform(get("/api/v1/insights/student/student-002")
            .header("X-User-Id", "student-001"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("AUTH_FORBIDDEN"));
  }

  @Test
  void studentInsightsShouldReturnPayloadForAdmin() throws Exception {
    UserAccount actor = UserAccount.builder().id("admin-001").role("admin").build();
    when(accessControlService.requireAuthenticated("admin-001")).thenReturn(actor);
    when(insightsService.getStudentInsights("student-001"))
        .thenReturn(new StudentInsightsDto(
            "student-001",
            "Student User",
            3,
            64.25,
            70.0,
            66.67,
            72.5,
            "improving",
            new QuestionTypeInsightDto("mcq", 7, 9, 77.78),
            new QuestionTypeInsightDto("integer", 4, 9, 44.44),
            List.of(new RecentAttemptInsightDto(
                "attempt-1",
                "exam-1",
                "Physics Test",
                70.0,
                true,
                OffsetDateTime.parse("2026-02-16T12:00:00Z")
            )),
            List.of("Keep going")
        ));

    mockMvc.perform(get("/api/v1/insights/student/student-001")
            .header("X-User-Id", "admin-001"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.studentId").value("student-001"))
        .andExpect(jsonPath("$.trend").value("improving"))
        .andExpect(jsonPath("$.strongestQuestionType.type").value("mcq"));
  }

  @Test
  void adminOverviewShouldRequireAdmin() throws Exception {
    when(accessControlService.requireAdmin("student-001"))
        .thenThrow(new ApiException(FORBIDDEN, "AUTH_FORBIDDEN", "Admin role is required"));

    mockMvc.perform(get("/api/v1/insights/admin/overview")
            .header("X-User-Id", "student-001"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("AUTH_FORBIDDEN"));
  }

  @Test
  void adminOverviewShouldReturnPayload() throws Exception {
    when(accessControlService.requireAdmin("admin-001"))
        .thenReturn(UserAccount.builder().id("admin-001").role("admin").build());
    when(insightsService.getAdminOverview())
        .thenReturn(new AdminInsightsDto(
            18,
            8,
            58.1,
            61.11,
            List.of(),
            List.of(),
            List.of(new DailyTrendInsightDto("2026-02-16", 3, 62.5, 66.67)),
            List.of("Monitor weakest exam")
        ));

    mockMvc.perform(get("/api/v1/insights/admin/overview")
            .header("X-User-Id", "admin-001"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.submittedAttempts").value(18))
        .andExpect(jsonPath("$.recentDailyTrend[0].date").value("2026-02-16"));
  }
}
