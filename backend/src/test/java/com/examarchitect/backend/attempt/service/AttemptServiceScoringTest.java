package com.examarchitect.backend.attempt.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.examarchitect.backend.attempt.dto.AttemptAnalysisDto;
import com.examarchitect.backend.attempt.dto.StudentAttemptDto;
import com.examarchitect.backend.attempt.dto.UpdateAttemptRequest;
import com.examarchitect.backend.attempt.model.ExamAttempt;
import com.examarchitect.backend.attempt.repository.ExamAttemptRepository;
import com.examarchitect.backend.common.api.ApiException;
import com.examarchitect.backend.exam.model.Exam;
import com.examarchitect.backend.exam.model.Question;
import com.examarchitect.backend.exam.repository.ExamRepository;
import com.examarchitect.backend.exam.repository.QuestionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AttemptServiceScoringTest {

  @Mock
  private ExamAttemptRepository examAttemptRepository;

  @Mock
  private ExamRepository examRepository;

  @Mock
  private QuestionRepository questionRepository;

  private AttemptService attemptService;

  @BeforeEach
  void setUp() {
    attemptService = new AttemptService(
        examAttemptRepository,
        examRepository,
        questionRepository,
        new ObjectMapper()
    );
  }

  @Test
  void submitAttemptShouldScoreMcqTrueFalseAndIntegerParity() {
    ExamAttempt attempt = ExamAttempt.builder()
        .id("attempt-1")
        .examId("exam-1")
        .studentId("student-001")
        .studentName("Student User")
        .answersJson("{\"q1\":\"m/s\",\"q2\":true,\"q3\":\"20\"}")
        .analyticsJson("{\"questionTimingMs\":{}}")
        .score(0)
        .totalMarks(0)
        .percentage(BigDecimal.ZERO)
        .status("in-progress")
        .startedAt(OffsetDateTime.parse("2026-02-14T10:00:00Z"))
        .build();

    Exam exam = Exam.builder().id("exam-1").status("active").build();
    Question q1 = Question.builder().id("q1").type("mcq").marks(2).correctAnswerText("m/s").build();
    Question q2 = Question.builder().id("q2").type("true_false").marks(1).correctAnswerBool(true).build();
    Question q3 = Question.builder().id("q3").type("integer").marks(3).correctAnswerNumber(new BigDecimal("20")).build();

    when(examAttemptRepository.findById("attempt-1")).thenReturn(Optional.of(attempt));
    when(examRepository.findById("exam-1")).thenReturn(Optional.of(exam));
    when(questionRepository.findByExamIdOrderByOrderIndexAsc("exam-1")).thenReturn(List.of(q1, q2, q3));
    when(examAttemptRepository.save(any(ExamAttempt.class))).thenAnswer(invocation -> invocation.getArgument(0));

    StudentAttemptDto result = attemptService.submitAttempt("attempt-1", "student-001");

    assertEquals(6, result.score());
    assertEquals(6, result.totalMarks());
    assertEquals("100.00", result.percentage().toPlainString());
    assertEquals("submitted", result.status());
    assertNotNull(result.submittedAt());
  }

  @Test
  void submitAttemptShouldTreatInvalidIntegerAnswerAsIncorrect() {
    ExamAttempt attempt = ExamAttempt.builder()
        .id("attempt-2")
        .examId("exam-2")
        .studentId("student-001")
        .studentName("Student User")
        .answersJson("{\"q1\":\"abc\"}")
        .analyticsJson("{\"questionTimingMs\":{}}")
        .score(0)
        .totalMarks(0)
        .percentage(BigDecimal.ZERO)
        .status("in-progress")
        .startedAt(OffsetDateTime.parse("2026-02-14T10:00:00Z"))
        .build();

    Exam exam = Exam.builder().id("exam-2").status("active").build();
    Question q1 = Question.builder().id("q1").type("integer").marks(2).correctAnswerNumber(new BigDecimal("10")).build();

    when(examAttemptRepository.findById("attempt-2")).thenReturn(Optional.of(attempt));
    when(examRepository.findById("exam-2")).thenReturn(Optional.of(exam));
    when(questionRepository.findByExamIdOrderByOrderIndexAsc("exam-2")).thenReturn(List.of(q1));
    when(examAttemptRepository.save(any(ExamAttempt.class))).thenAnswer(invocation -> invocation.getArgument(0));

    StudentAttemptDto result = attemptService.submitAttempt("attempt-2", "student-001");

    assertEquals(0, result.score());
    assertEquals(2, result.totalMarks());
    assertEquals("0.00", result.percentage().toPlainString());
  }

  @Test
  void updateAttemptShouldRejectSubmittedAttempt() {
    ExamAttempt attempt = ExamAttempt.builder()
        .id("attempt-3")
        .examId("exam-1")
        .studentId("student-001")
        .studentName("Student User")
        .answersJson("{}")
        .analyticsJson("{\"questionTimingMs\":{}}")
        .score(3)
        .totalMarks(3)
        .percentage(new BigDecimal("100"))
        .status("submitted")
        .startedAt(OffsetDateTime.parse("2026-02-14T10:00:00Z"))
        .submittedAt(OffsetDateTime.parse("2026-02-14T10:30:00Z"))
        .build();

    when(examAttemptRepository.findById("attempt-3")).thenReturn(Optional.of(attempt));

    ApiException ex = assertThrows(ApiException.class, () ->
        attemptService.updateAttempt("attempt-3", new UpdateAttemptRequest(Map.of("q1", "m/s"), null), "student-001"));

    assertEquals("ATTEMPT_ALREADY_SUBMITTED", ex.getCode());
  }

  @Test
  void updateAttemptShouldRejectDifferentStudentActor() {
    ExamAttempt attempt = ExamAttempt.builder()
        .id("attempt-4")
        .examId("exam-1")
        .studentId("student-001")
        .studentName("Student User")
        .answersJson("{}")
        .analyticsJson("{\"questionTimingMs\":{}}")
        .score(0)
        .totalMarks(3)
        .percentage(BigDecimal.ZERO)
        .status("in-progress")
        .startedAt(OffsetDateTime.parse("2026-02-14T10:00:00Z"))
        .build();

    when(examAttemptRepository.findById("attempt-4")).thenReturn(Optional.of(attempt));

    ApiException ex = assertThrows(ApiException.class, () ->
        attemptService.updateAttempt("attempt-4", new UpdateAttemptRequest(Map.of("q1", "m/s"), null), "student-999"));

    assertEquals("AUTH_FORBIDDEN", ex.getCode());
  }

  @Test
  void getAttemptAnalysisShouldAggregatePerSubjectMetricsAndTiming() {
    ExamAttempt attempt = ExamAttempt.builder()
        .id("attempt-5")
        .examId("exam-5")
        .studentId("student-001")
        .studentName("Student User")
        .answersJson("{\"q1\":\"m/s\",\"q2\":\"wrong\"}")
        .analyticsJson("{\"questionTimingMs\":{\"q1\":60000,\"q2\":30000,\"q3\":15000}}")
        .score(4)
        .totalMarks(8)
        .percentage(new BigDecimal("50.00"))
        .status("submitted")
        .startedAt(OffsetDateTime.parse("2026-02-14T10:00:00Z"))
        .submittedAt(OffsetDateTime.parse("2026-02-14T10:30:00Z"))
        .build();

    Exam exam = Exam.builder().id("exam-5").title("JEE Mock").status("active").build();
    Question q1 = Question.builder()
        .id("q1")
        .type("mcq")
        .subject("Physics")
        .marks(4)
        .correctAnswerText("m/s")
        .build();
    Question q2 = Question.builder()
        .id("q2")
        .type("mcq")
        .subject("Physics")
        .marks(4)
        .correctAnswerText("correct")
        .build();
    Question q3 = Question.builder()
        .id("q3")
        .type("mcq")
        .subject("Chemistry")
        .marks(2)
        .correctAnswerText("x")
        .build();

    when(examAttemptRepository.findById("attempt-5")).thenReturn(Optional.of(attempt));
    when(examRepository.findById("exam-5")).thenReturn(Optional.of(exam));
    when(questionRepository.findByExamIdOrderByOrderIndexAsc("exam-5")).thenReturn(List.of(q1, q2, q3));

    AttemptAnalysisDto analysis = attemptService.getAttemptAnalysis("attempt-5", "student-001");

    assertEquals("attempt-5", analysis.attemptId());
    assertEquals(2, analysis.subjects().size());

    var physics = analysis.subjects().stream().filter(s -> s.subject().equals("Physics")).findFirst().orElseThrow();
    assertEquals(2, physics.totalQuestions());
    assertEquals(2, physics.attemptedQuestions());
    assertEquals(1, physics.correctQuestions());
    assertEquals(1, physics.wrongQuestions());
    assertEquals(0, physics.unattemptedQuestions());
    assertEquals(4, physics.marksObtained());
    assertEquals(8, physics.totalMarks());
    assertEquals("90.00", physics.totalTimeSpentSeconds().toPlainString());

    var chemistry = analysis.subjects().stream().filter(s -> s.subject().equals("Chemistry")).findFirst().orElseThrow();
    assertEquals(1, chemistry.totalQuestions());
    assertEquals(0, chemistry.attemptedQuestions());
    assertEquals(1, chemistry.unattemptedQuestions());
    assertEquals("15.00", chemistry.totalTimeSpentSeconds().toPlainString());
  }
}
