package com.examarchitect.backend.assistant.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

import com.examarchitect.backend.assistant.dto.AssistantChatRequest;
import com.examarchitect.backend.auth.model.UserAccount;
import com.examarchitect.backend.insights.dto.AdminInsightsDto;
import com.examarchitect.backend.insights.dto.DailyTrendInsightDto;
import com.examarchitect.backend.insights.dto.QuestionTypeInsightDto;
import com.examarchitect.backend.insights.dto.RecentAttemptInsightDto;
import com.examarchitect.backend.insights.dto.StudentInsightsDto;
import com.examarchitect.backend.insights.service.InsightsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AssistantServiceTest {

  @Mock
  private InsightsService insightsService;

  @Mock
  private AssistantLlmClient assistantLlmClient;

  private AssistantService assistantService;

  @BeforeEach
  void setUp() {
    assistantService = new AssistantService(insightsService, assistantLlmClient, new ObjectMapper());
  }

  @Test
  void chatShouldUseLiveModeWhenLlmReturnsStructuredResponse() {
    UserAccount actor = UserAccount.builder().id("student-001").role("student").build();
    StudentInsightsDto studentInsights = sampleStudentInsights();
    when(insightsService.getStudentInsights("student-001")).thenReturn(studentInsights);
    when(assistantLlmClient.generateReply(
        org.mockito.ArgumentMatchers.eq("student"),
        org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.anyList(),
        org.mockito.ArgumentMatchers.anyString()))
        .thenReturn(Optional.of(new AssistantLlmResponse(
            "Your trend is improving.",
            List.of("Trend improving", "Pass rate above 60%"),
            List.of("Increase mock frequency")
        )));

    var response = assistantService.chat(actor, new AssistantChatRequest("How am I doing?", "student-001", List.of()));

    assertEquals("live", response.mode());
    assertEquals("Your trend is improving.", response.reply());
    assertEquals(2, response.keyPoints().size());
    assertNotNull(response.generatedAt());
  }

  @Test
  void chatShouldFallbackWhenLlmUnavailable() {
    UserAccount actor = UserAccount.builder().id("admin-001").role("admin").build();
    AdminInsightsDto adminInsights = new AdminInsightsDto(
        20,
        8,
        58.2,
        60.0,
        List.of(),
        List.of(),
        List.of(new DailyTrendInsightDto("2026-02-16", 2, 61.0, 50.0)),
        List.of("Review hardest exam")
    );

    when(insightsService.getAdminOverview()).thenReturn(adminInsights);
    when(assistantLlmClient.generateReply(
        org.mockito.ArgumentMatchers.eq("admin"),
        org.mockito.ArgumentMatchers.anyString(),
        org.mockito.ArgumentMatchers.anyList(),
        org.mockito.ArgumentMatchers.anyString()))
        .thenReturn(Optional.empty());

    var response = assistantService.chat(actor, new AssistantChatRequest("Give me admin summary", null, List.of()));

    assertEquals("fallback", response.mode());
    assertEquals(3, response.keyPoints().size());
    assertEquals(1, response.nextActions().size());
  }

  private StudentInsightsDto sampleStudentInsights() {
    return new StudentInsightsDto(
        "student-001",
        "Student User",
        3,
        63.3,
        70.0,
        66.7,
        72.1,
        "improving",
        new QuestionTypeInsightDto("mcq", 7, 9, 77.7),
        new QuestionTypeInsightDto("integer", 4, 9, 44.4),
        List.of(new RecentAttemptInsightDto(
            "attempt-1",
            "exam-1",
            "Physics Test",
            70.0,
            true,
            OffsetDateTime.parse("2026-02-16T10:00:00Z")
        )),
        List.of("Practice integer drills")
    );
  }
}
