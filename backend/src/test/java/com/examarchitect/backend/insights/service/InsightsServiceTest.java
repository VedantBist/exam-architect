package com.examarchitect.backend.insights.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

import com.examarchitect.backend.attempt.model.ExamAttempt;
import com.examarchitect.backend.attempt.repository.ExamAttemptRepository;
import com.examarchitect.backend.exam.model.Exam;
import com.examarchitect.backend.exam.model.Question;
import com.examarchitect.backend.exam.repository.ExamRepository;
import com.examarchitect.backend.exam.repository.QuestionRepository;
import com.examarchitect.backend.insights.dto.AdminInsightsDto;
import com.examarchitect.backend.insights.dto.StudentInsightsDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InsightsServiceTest {

  @Mock
  private ExamAttemptRepository examAttemptRepository;

  @Mock
  private ExamRepository examRepository;

  @Mock
  private QuestionRepository questionRepository;

  private InsightsService insightsService;

  @BeforeEach
  void setUp() {
    insightsService = new InsightsService(
        examAttemptRepository,
        examRepository,
        questionRepository,
        new ObjectMapper()
    );
  }

  @Test
  void studentInsightsShouldComputeTrendAndWeakAreas() {
    OffsetDateTime baseTime = OffsetDateTime.parse("2026-02-10T12:00:00Z");
    List<ExamAttempt> attempts = List.of(
        submittedAttempt("attempt-1", "exam-1", "student-001", "Student User", "30.00", baseTime,
            "{\"q1\":\"m/s\",\"q2\":8,\"q3\":false}"),
        submittedAttempt("attempt-2", "exam-1", "student-001", "Student User", "55.00", baseTime.plusDays(2),
            "{\"q1\":\"m/s\",\"q2\":10,\"q3\":false}"),
        submittedAttempt("attempt-3", "exam-1", "student-001", "Student User", "70.00", baseTime.plusDays(4),
            "{\"q1\":\"m/s\",\"q2\":10,\"q3\":false}")
    );

    when(examAttemptRepository.findByStudentIdOrderByStartedAtDesc("student-001")).thenReturn(attempts);
    when(examRepository.findAll()).thenReturn(List.of(
        Exam.builder().id("exam-1").title("Physics Test").passingPercentage(40).build()
    ));
    when(questionRepository.findByExamIdInOrderByOrderIndexAsc(List.of("exam-1"))).thenReturn(List.of(
        Question.builder().id("q1").examId("exam-1").type("mcq").correctAnswerText("m/s").build(),
        Question.builder().id("q2").examId("exam-1").type("integer").correctAnswerNumber(new BigDecimal("10")).build(),
        Question.builder().id("q3").examId("exam-1").type("true_false").correctAnswerBool(true).build()
    ));

    StudentInsightsDto insights = insightsService.getStudentInsights("student-001");

    assertEquals("student-001", insights.studentId());
    assertEquals("improving", insights.trend());
    assertEquals(66.67, insights.passRate());
    assertEquals(58.33, insights.predictedNextPercentage());
    assertNotNull(insights.strongestQuestionType());
    assertEquals("mcq", insights.strongestQuestionType().type());
    assertNotNull(insights.weakestQuestionType());
    assertEquals("true_false", insights.weakestQuestionType().type());
    assertEquals(3, insights.recentAttempts().size());
    assertNotNull(insights.recommendations());
  }

  @Test
  void adminInsightsShouldComputeHardestExamAndAtRiskStudents() {
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
    List<ExamAttempt> attempts = List.of(
        submittedAttempt("a1", "exam-1", "student-1", "Student 1", "35.00", now.minusDays(5), "{}"),
        submittedAttempt("a2", "exam-2", "student-1", "Student 1", "62.00", now.minusDays(4), "{}"),
        submittedAttempt("a3", "exam-1", "student-2", "Student 2", "25.00", now.minusDays(3), "{}"),
        submittedAttempt("a4", "exam-2", "student-2", "Student 2", "70.00", now.minusDays(2), "{}"),
        submittedAttempt("a5", "exam-1", "student-3", "Student 3", "30.00", now.minusDays(1), "{}")
    );

    when(examAttemptRepository.findAll()).thenReturn(attempts);
    when(examRepository.findAll()).thenReturn(List.of(
        Exam.builder().id("exam-1").title("Physics Test").passingPercentage(40).build(),
        Exam.builder().id("exam-2").title("Chemistry Test").passingPercentage(50).build()
    ));

    AdminInsightsDto insights = insightsService.getAdminOverview();

    assertEquals(5, insights.submittedAttempts());
    assertEquals(3, insights.uniqueStudents());
    assertEquals(44.4, insights.averagePercentage());
    assertEquals(40.0, insights.passRate());
    assertEquals("exam-1", insights.hardestExams().get(0).examId());
    assertEquals(3, insights.atRiskStudents().size());
    assertEquals(7, insights.recentDailyTrend().size());
    assertNotNull(insights.recommendations());
  }

  private ExamAttempt submittedAttempt(
      String id,
      String examId,
      String studentId,
      String studentName,
      String percentage,
      OffsetDateTime submittedAt,
      String answersJson
  ) {
    return ExamAttempt.builder()
        .id(id)
        .examId(examId)
        .studentId(studentId)
        .studentName(studentName)
        .answersJson(answersJson)
        .score(0)
        .totalMarks(0)
        .percentage(new BigDecimal(percentage))
        .status("submitted")
        .startedAt(submittedAt.minusMinutes(30))
        .submittedAt(submittedAt)
        .build();
  }
}
