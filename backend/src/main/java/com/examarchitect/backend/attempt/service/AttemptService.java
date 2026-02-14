package com.examarchitect.backend.attempt.service;

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

  private String writeAnswers(Map<String, Object> answers) {
    try {
      return objectMapper.writeValueAsString(answers);
    } catch (JsonProcessingException ex) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid answers payload");
    }
  }

  private String generateAttemptId() {
    return "attempt-" + System.currentTimeMillis() + "-" + Integer.toHexString(RANDOM.nextInt(1_000_000));
  }
}
