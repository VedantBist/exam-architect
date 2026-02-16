package com.examarchitect.backend.assistant.service;

import com.examarchitect.backend.assistant.dto.AssistantChatRequest;
import com.examarchitect.backend.assistant.dto.AssistantChatResponse;
import com.examarchitect.backend.assistant.dto.AssistantConversationTurnDto;
import com.examarchitect.backend.auth.model.UserAccount;
import com.examarchitect.backend.common.api.ApiException;
import com.examarchitect.backend.insights.dto.AdminInsightsDto;
import com.examarchitect.backend.insights.dto.StudentInsightsDto;
import com.examarchitect.backend.insights.service.InsightsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AssistantService {

  private final InsightsService insightsService;
  private final AssistantLlmClient assistantLlmClient;
  private final ObjectMapper objectMapper;

  public AssistantService(
      InsightsService insightsService,
      AssistantLlmClient assistantLlmClient,
      ObjectMapper objectMapper
  ) {
    this.insightsService = insightsService;
    this.assistantLlmClient = assistantLlmClient;
    this.objectMapper = objectMapper;
  }

  public AssistantChatResponse chat(UserAccount actor, AssistantChatRequest request) {
    String actorRole = actor.getRole() == null ? "student" : actor.getRole().toLowerCase(Locale.ROOT);
    String targetStudentId = resolveTargetStudentId(actor, request.studentId());
    List<AssistantConversationTurnDto> safeHistory = sanitizeHistory(request.history());

    StudentInsightsDto studentInsights = targetStudentId != null
        ? insightsService.getStudentInsights(targetStudentId)
        : null;
    AdminInsightsDto adminInsights = "admin".equals(actorRole)
        ? insightsService.getAdminOverview()
        : null;

    String contextJson = serializeContext(actorRole, actor.getId(), targetStudentId, studentInsights, adminInsights);
    Optional<AssistantLlmResponse> llmResponse = assistantLlmClient.generateReply(
        actorRole,
        request.message().trim(),
        safeHistory,
        contextJson
    );

    if (llmResponse.isPresent()) {
      AssistantLlmResponse response = llmResponse.get();
      return new AssistantChatResponse(
          "live",
          response.reply(),
          limitList(response.keyPoints(), 5),
          limitList(response.nextActions(), 5),
          OffsetDateTime.now()
      );
    }

    return fallbackResponse(actorRole, request.message(), studentInsights, adminInsights);
  }

  private String resolveTargetStudentId(UserAccount actor, String requestedStudentId) {
    String actorRole = actor.getRole() == null ? "student" : actor.getRole().toLowerCase(Locale.ROOT);
    if ("student".equals(actorRole)) {
      if (requestedStudentId != null && !requestedStudentId.isBlank() && !requestedStudentId.equals(actor.getId())) {
        throw new ApiException(HttpStatus.FORBIDDEN, "AUTH_FORBIDDEN", "You can only access your own records");
      }
      return actor.getId();
    }

    if ("admin".equals(actorRole)) {
      return requestedStudentId == null || requestedStudentId.isBlank() ? null : requestedStudentId.trim();
    }

    throw new ApiException(HttpStatus.FORBIDDEN, "AUTH_FORBIDDEN", "Unsupported role for assistant");
  }

  private List<AssistantConversationTurnDto> sanitizeHistory(List<AssistantConversationTurnDto> history) {
    if (history == null || history.isEmpty()) {
      return List.of();
    }

    List<AssistantConversationTurnDto> turns = new ArrayList<>();
    for (AssistantConversationTurnDto turn : history) {
      if (turn == null || turn.content() == null || turn.content().isBlank()) {
        continue;
      }
      String role = "assistant".equalsIgnoreCase(turn.role()) ? "assistant" : "user";
      turns.add(new AssistantConversationTurnDto(role, turn.content().trim()));
      if (turns.size() == 10) {
        break;
      }
    }
    return turns;
  }

  private String serializeContext(
      String actorRole,
      String actorId,
      String targetStudentId,
      StudentInsightsDto studentInsights,
      AdminInsightsDto adminInsights
  ) {
    Map<String, Object> context = new LinkedHashMap<>();
    context.put("actorRole", actorRole);
    context.put("actorId", actorId);
    context.put("targetStudentId", targetStudentId);
    context.put("studentInsights", studentInsights);
    context.put("adminInsights", adminInsights);

    try {
      return objectMapper.writeValueAsString(context);
    } catch (Exception ex) {
      return "{\"error\":\"CONTEXT_SERIALIZATION_FAILED\"}";
    }
  }

  private AssistantChatResponse fallbackResponse(
      String actorRole,
      String message,
      StudentInsightsDto studentInsights,
      AdminInsightsDto adminInsights
  ) {
    if ("admin".equals(actorRole)) {
      return buildAdminFallback(message, adminInsights, studentInsights);
    }
    return buildStudentFallback(message, studentInsights);
  }

  private AssistantChatResponse buildStudentFallback(String message, StudentInsightsDto insights) {
    String normalizedMessage = message == null ? "" : message.toLowerCase(Locale.ROOT);
    String weakestType = insights != null && insights.weakestQuestionType() != null
        ? insights.weakestQuestionType().type().replace('_', ' ')
        : "insufficient data";

    String reply = """
        I can help with your score trend, weak areas, and study actions.
        Current trend: %s, pass rate: %.1f%%, predicted next score: %.1f%%.
        Weakest area right now: %s.
        """
        .formatted(
            insights != null ? insights.trend().replace('_', ' ') : "insufficient data",
            insights != null ? insights.passRate() : 0.0,
            insights != null ? insights.predictedNextPercentage() : 0.0,
            weakestType
        )
        .trim();

    if (normalizedMessage.contains("weak")) {
      reply = "Your weakest area is " + weakestType + ". Focus practice there first before full mocks.";
    } else if (normalizedMessage.contains("trend")) {
      reply = "Your current trend is "
          + (insights != null ? insights.trend().replace('_', ' ') : "insufficient data")
          + ". Keep a steady exam cadence and review recent mistakes.";
    }

    List<String> keyPoints = List.of(
        "Trend: " + (insights != null ? insights.trend().replace('_', ' ') : "insufficient data"),
        "Pass Rate: " + String.format(Locale.ROOT, "%.1f%%", insights != null ? insights.passRate() : 0.0),
        "Predicted Next: " + String.format(Locale.ROOT, "%.1f%%", insights != null ? insights.predictedNextPercentage() : 0.0)
    );
    List<String> nextActions = insights != null
        ? limitList(insights.recommendations(), 4)
        : List.of("Submit at least one exam attempt to unlock personalized recommendations.");

    return new AssistantChatResponse("fallback", reply, keyPoints, nextActions, OffsetDateTime.now());
  }

  private AssistantChatResponse buildAdminFallback(
      String message,
      AdminInsightsDto adminInsights,
      StudentInsightsDto targetedStudentInsights
  ) {
    String normalizedMessage = message == null ? "" : message.toLowerCase(Locale.ROOT);
    String hardestExam = adminInsights != null && !adminInsights.hardestExams().isEmpty()
        ? adminInsights.hardestExams().get(0).examTitle()
        : "insufficient data";
    String atRiskCount = adminInsights != null ? String.valueOf(adminInsights.atRiskStudents().size()) : "0";

    String reply = """
        Cohort snapshot: pass rate %.1f%% with %s at-risk students.
        Hardest exam currently: %s.
        Prioritize remediation for declining learners and review question calibration.
        """
        .formatted(
            adminInsights != null ? adminInsights.passRate() : 0.0,
            atRiskCount,
            hardestExam
        )
        .trim();

    if (normalizedMessage.contains("student") && targetedStudentInsights != null) {
      reply = """
          Student trend: %s, pass rate %.1f%%, predicted next score %.1f%%.
          Use targeted practice in weakest area and monitor progress over next 2 attempts.
          """
          .formatted(
              targetedStudentInsights.trend().replace('_', ' '),
              targetedStudentInsights.passRate(),
              targetedStudentInsights.predictedNextPercentage()
          )
          .trim();
    }

    List<String> keyPoints = List.of(
        "Overall Pass Rate: " + String.format(Locale.ROOT, "%.1f%%", adminInsights != null ? adminInsights.passRate() : 0.0),
        "At-Risk Students: " + atRiskCount,
        "Hardest Exam: " + hardestExam
    );
    List<String> nextActions = adminInsights != null
        ? limitList(adminInsights.recommendations(), 4)
        : List.of("Collect submitted attempts to generate reliable cohort recommendations.");

    return new AssistantChatResponse("fallback", reply, keyPoints, nextActions, OffsetDateTime.now());
  }

  private List<String> limitList(List<String> values, int limit) {
    if (values == null || values.isEmpty()) {
      return List.of();
    }

    List<String> filtered = new ArrayList<>();
    for (String value : values) {
      if (value != null && !value.isBlank()) {
        filtered.add(value);
      }
      if (filtered.size() == limit) {
        break;
      }
    }
    return filtered;
  }
}
