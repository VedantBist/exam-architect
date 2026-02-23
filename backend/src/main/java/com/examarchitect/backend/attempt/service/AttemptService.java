package com.examarchitect.backend.attempt.service;

import com.examarchitect.backend.attempt.dto.AttemptAnalysisDto;
import com.examarchitect.backend.attempt.dto.AttemptSubjectAnalysisDto;
import com.examarchitect.backend.attempt.dto.CreateAttemptRequest;
import com.examarchitect.backend.attempt.dto.StudentAttemptDto;
import com.examarchitect.backend.attempt.dto.UpdateAttemptRequest;
import com.examarchitect.backend.attempt.model.ExamAttempt;
import com.examarchitect.backend.attempt.repository.ExamAttemptRepository;
import com.examarchitect.backend.common.api.ApiException;
import com.examarchitect.backend.exam.model.Exam;
import com.examarchitect.backend.exam.model.Question;
import com.examarchitect.backend.exam.repository.ExamRepository;
import com.examarchitect.backend.exam.repository.QuestionRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AttemptService {

  private static final SecureRandom RANDOM = new SecureRandom();
  private static final String DEFAULT_SUBJECT = "General";

  private final ExamAttemptRepository examAttemptRepository;
  private final ExamRepository examRepository;
  private final QuestionRepository questionRepository;
  private final ObjectMapper objectMapper;

  public AttemptService(
      ExamAttemptRepository examAttemptRepository,
      ExamRepository examRepository,
      QuestionRepository questionRepository,
      ObjectMapper objectMapper
  ) {
    this.examAttemptRepository = examAttemptRepository;
    this.examRepository = examRepository;
    this.questionRepository = questionRepository;
    this.objectMapper = objectMapper;
  }

  public List<StudentAttemptDto> getAttemptsByStudent(String studentId) {
    return examAttemptRepository.findByStudentIdOrderByStartedAtDesc(studentId)
        .stream()
        .map(this::toDto)
        .toList();
  }

  public Optional<StudentAttemptDto> getAttemptByExamAndStudent(String examId, String studentId) {
    return examAttemptRepository.findByExamIdAndStudentId(examId, studentId)
        .map(this::toDto);
  }

  public AttemptAnalysisDto getAttemptAnalysis(String attemptId, String actorUserId) {
    ExamAttempt attempt = examAttemptRepository.findById(attemptId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ATTEMPT_NOT_FOUND", "Attempt not found"));

    if (!attempt.getStudentId().equals(actorUserId)) {
      throw new ApiException(HttpStatus.FORBIDDEN, "AUTH_FORBIDDEN", "You can only access your own attempt analysis");
    }

    Exam exam = examRepository.findById(attempt.getExamId())
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EXAM_NOT_FOUND", "Exam not found"));

    List<Question> questions = questionRepository.findByExamIdOrderByOrderIndexAsc(exam.getId());
    Map<String, Object> answers = readAnswers(attempt.getAnswersJson());
    Map<String, Long> questionTimingMs = extractQuestionTimingMs(readAnalytics(attempt.getAnalyticsJson()));

    Map<String, SubjectAnalysisAccumulator> bySubject = new LinkedHashMap<>();
    for (Question question : questions) {
      String subject = normalizeSubject(question.getSubject());
      SubjectAnalysisAccumulator acc = bySubject.computeIfAbsent(subject, SubjectAnalysisAccumulator::new);

      acc.totalQuestions += 1;
      acc.totalMarks += question.getMarks();
      acc.totalTimeSpentMs += questionTimingMs.getOrDefault(question.getId(), 0L);

      Object answer = answers.get(question.getId());
      if (!hasAttemptedAnswer(answer)) {
        continue;
      }

      acc.attemptedQuestions += 1;
      if (isCorrectAnswer(question, answer)) {
        acc.correctQuestions += 1;
        acc.marksObtained += question.getMarks();
      } else {
        acc.wrongQuestions += 1;
      }
    }

    List<AttemptSubjectAnalysisDto> subjects = bySubject.values().stream()
        .map(acc -> {
          int unattempted = Math.max(0, acc.totalQuestions - acc.attemptedQuestions);
          BigDecimal marksPercentage = acc.totalMarks == 0
              ? BigDecimal.ZERO
              : BigDecimal.valueOf(acc.marksObtained)
                  .multiply(BigDecimal.valueOf(100))
                  .divide(BigDecimal.valueOf(acc.totalMarks), 2, RoundingMode.HALF_UP);
          BigDecimal totalTimeSeconds = BigDecimal.valueOf(acc.totalTimeSpentMs)
              .divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP);
          BigDecimal avgTimePerQuestionSeconds = acc.totalQuestions == 0
              ? BigDecimal.ZERO
              : BigDecimal.valueOf(acc.totalTimeSpentMs)
                  .divide(BigDecimal.valueOf(acc.totalQuestions), 2, RoundingMode.HALF_UP)
                  .divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP);
          BigDecimal avgTimePerAttemptedQuestionSeconds = acc.attemptedQuestions == 0
              ? BigDecimal.ZERO
              : BigDecimal.valueOf(acc.totalTimeSpentMs)
                  .divide(BigDecimal.valueOf(acc.attemptedQuestions), 2, RoundingMode.HALF_UP)
                  .divide(BigDecimal.valueOf(1000), 2, RoundingMode.HALF_UP);

          return new AttemptSubjectAnalysisDto(
              acc.subject,
              acc.totalQuestions,
              acc.attemptedQuestions,
              acc.correctQuestions,
              acc.wrongQuestions,
              unattempted,
              acc.marksObtained,
              acc.totalMarks,
              marksPercentage,
              avgTimePerQuestionSeconds,
              avgTimePerAttemptedQuestionSeconds,
              totalTimeSeconds
          );
        })
        .toList();

    return new AttemptAnalysisDto(
        attempt.getId(),
        attempt.getExamId(),
        exam.getTitle(),
        attempt.getScore(),
        attempt.getTotalMarks(),
        attempt.getPercentage(),
        attempt.getStatus(),
        attempt.getStartedAt(),
        attempt.getSubmittedAt(),
        subjects
    );
  }

  @Transactional
  public StudentAttemptDto createAttempt(CreateAttemptRequest request) {
    Exam exam = examRepository.findById(request.examId())
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EXAM_NOT_FOUND", "Exam not found"));

    if (!"active".equals(exam.getStatus())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "EXAM_NOT_ACTIVE", "This exam is not currently active");
    }

    Optional<ExamAttempt> existing = examAttemptRepository.findByExamIdAndStudentId(request.examId(), request.studentId());
    if (existing.isPresent()) {
      return toDto(existing.get());
    }

    int totalMarks = questionRepository.findByExamIdOrderByOrderIndexAsc(request.examId())
        .stream()
        .mapToInt(Question::getMarks)
        .sum();

    ExamAttempt attempt = ExamAttempt.builder()
        .id(generateAttemptId())
        .examId(request.examId())
        .studentId(request.studentId())
        .studentName(request.studentName().trim())
        .answersJson("{}")
        .analyticsJson("{\"questionTimingMs\":{}}")
        .score(0)
        .totalMarks(totalMarks)
        .percentage(BigDecimal.ZERO)
        .status("in-progress")
        .startedAt(OffsetDateTime.now())
        .build();

    return toDto(examAttemptRepository.save(attempt));
  }

  @Transactional
  public StudentAttemptDto updateAttempt(String attemptId, UpdateAttemptRequest request, String actorUserId) {
    ExamAttempt attempt = examAttemptRepository.findById(attemptId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ATTEMPT_NOT_FOUND", "Attempt not found"));

    if (!attempt.getStudentId().equals(actorUserId)) {
      throw new ApiException(HttpStatus.FORBIDDEN, "AUTH_FORBIDDEN", "You can only update your own attempt");
    }

    if (!"in-progress".equals(attempt.getStatus())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "ATTEMPT_ALREADY_SUBMITTED", "Attempt is already submitted");
    }

    if (request.answers() != null) {
      attempt.setAnswersJson(writeAnswers(request.answers()));
    }
    if (request.analytics() != null) {
      attempt.setAnalyticsJson(writeAnalytics(request.analytics()));
    }

    return toDto(examAttemptRepository.save(attempt));
  }

  @Transactional
  public StudentAttemptDto submitAttempt(String attemptId, String actorUserId) {
    ExamAttempt attempt = examAttemptRepository.findById(attemptId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ATTEMPT_NOT_FOUND", "Attempt not found"));

    if (!attempt.getStudentId().equals(actorUserId)) {
      throw new ApiException(HttpStatus.FORBIDDEN, "AUTH_FORBIDDEN", "You can only submit your own attempt");
    }

    if ("submitted".equals(attempt.getStatus())) {
      return toDto(attempt);
    }

    Exam exam = examRepository.findById(attempt.getExamId())
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EXAM_NOT_FOUND", "Exam not found"));

    List<Question> questions = questionRepository.findByExamIdOrderByOrderIndexAsc(exam.getId());
    Map<String, Object> answers = readAnswers(attempt.getAnswersJson());

    int score = 0;
    int totalMarks = 0;

    for (Question question : questions) {
      totalMarks += question.getMarks();
      Object answer = answers.get(question.getId());
      if (answer == null) {
        continue;
      }

      if (isCorrectAnswer(question, answer)) {
        score += question.getMarks();
      }
    }

    BigDecimal percentage = totalMarks == 0
        ? BigDecimal.ZERO
        : BigDecimal.valueOf(score)
            .multiply(BigDecimal.valueOf(100))
            .divide(BigDecimal.valueOf(totalMarks), 2, RoundingMode.HALF_UP);

    attempt.setScore(score);
    attempt.setTotalMarks(totalMarks);
    attempt.setPercentage(percentage);
    attempt.setStatus("submitted");
    attempt.setSubmittedAt(OffsetDateTime.now());

    return toDto(examAttemptRepository.save(attempt));
  }

  private boolean isCorrectAnswer(Question question, Object answer) {
    String type = question.getType().toLowerCase(Locale.ROOT);

    try {
      return switch (type) {
        case "true_false" -> {
          boolean parsed = answer instanceof Boolean b ? b : Boolean.parseBoolean(answer.toString());
          yield question.getCorrectAnswerBool() != null && question.getCorrectAnswerBool() == parsed;
        }
        case "integer" -> {
          if (question.getCorrectAnswerNumber() == null) {
            yield false;
          }
          BigDecimal parsed = new BigDecimal(answer.toString().trim());
          yield parsed.compareTo(question.getCorrectAnswerNumber()) == 0;
        }
        default -> question.getCorrectAnswerText() != null
            && question.getCorrectAnswerText().equals(answer.toString());
      };
    } catch (Exception ex) {
      return false;
    }
  }

  private StudentAttemptDto toDto(ExamAttempt attempt) {
    return new StudentAttemptDto(
        attempt.getId(),
        attempt.getExamId(),
        attempt.getStudentId(),
        attempt.getStudentName(),
        readAnswers(attempt.getAnswersJson()),
        readAnalytics(attempt.getAnalyticsJson()),
        attempt.getScore(),
        attempt.getTotalMarks(),
        attempt.getPercentage(),
        attempt.getStatus(),
        attempt.getStartedAt(),
        attempt.getSubmittedAt()
    );
  }

  private Map<String, Object> readAnswers(String json) {
    if (json == null || json.isBlank()) {
      return new HashMap<>();
    }

    try {
      return objectMapper.readValue(json, new TypeReference<>() {
      });
    } catch (JsonProcessingException ex) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Invalid stored answers JSON");
    }
  }

  private Map<String, Object> readAnalytics(String json) {
    if (json == null || json.isBlank()) {
      return new HashMap<>();
    }

    try {
      return objectMapper.readValue(json, new TypeReference<>() {
      });
    } catch (JsonProcessingException ex) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "Invalid stored analytics JSON");
    }
  }

  private String writeAnswers(Map<String, Object> answers) {
    try {
      return objectMapper.writeValueAsString(answers);
    } catch (JsonProcessingException ex) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid answers payload");
    }
  }

  private String writeAnalytics(Map<String, Object> analytics) {
    try {
      return objectMapper.writeValueAsString(analytics);
    } catch (JsonProcessingException ex) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid analytics payload");
    }
  }

  private Map<String, Long> extractQuestionTimingMs(Map<String, Object> analytics) {
    Object rawTiming = analytics.get("questionTimingMs");
    if (!(rawTiming instanceof Map<?, ?> rawMap)) {
      return Map.of();
    }

    Map<String, Long> result = new HashMap<>();
    for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
      if (!(entry.getKey() instanceof String questionId)) {
        continue;
      }
      Object value = entry.getValue();
      if (value instanceof Number num) {
        result.put(questionId, Math.max(0L, num.longValue()));
        continue;
      }
      if (value instanceof String str) {
        try {
          result.put(questionId, Math.max(0L, Long.parseLong(str)));
        } catch (NumberFormatException ignored) {
          // Ignore malformed timing values and continue.
        }
      }
    }
    return result;
  }

  private String normalizeSubject(String subject) {
    if (subject == null || subject.isBlank()) {
      return DEFAULT_SUBJECT;
    }
    return subject.trim();
  }

  private boolean hasAttemptedAnswer(Object answer) {
    if (answer == null) {
      return false;
    }
    if (answer instanceof String s) {
      return !s.trim().isEmpty();
    }
    return true;
  }

  private static class SubjectAnalysisAccumulator {
    private final String subject;
    private int totalQuestions;
    private int attemptedQuestions;
    private int correctQuestions;
    private int wrongQuestions;
    private int marksObtained;
    private int totalMarks;
    private long totalTimeSpentMs;

    private SubjectAnalysisAccumulator(String subject) {
      this.subject = subject;
    }
  }

  private String generateAttemptId() {
    return "attempt-" + System.currentTimeMillis() + "-" + Integer.toHexString(RANDOM.nextInt(1_000_000));
  }
}
