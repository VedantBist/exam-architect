package com.examarchitect.backend.exam.service;

import com.examarchitect.backend.common.api.ApiException;
import com.examarchitect.backend.exam.dto.CreateExamOptionRequest;
import com.examarchitect.backend.exam.dto.CreateExamQuestionRequest;
import com.examarchitect.backend.exam.dto.CreateExamRequest;
import com.examarchitect.backend.exam.dto.ExamDto;
import com.examarchitect.backend.exam.dto.ExamOptionDto;
import com.examarchitect.backend.exam.dto.ExamQuestionDto;
import com.examarchitect.backend.exam.dto.ExamSummaryDto;
import com.examarchitect.backend.exam.dto.UpdateExamRequest;
import com.examarchitect.backend.exam.model.Exam;
import com.examarchitect.backend.exam.model.Question;
import com.examarchitect.backend.exam.model.QuestionOption;
import com.examarchitect.backend.exam.repository.ExamRepository;
import com.examarchitect.backend.exam.repository.QuestionOptionRepository;
import com.examarchitect.backend.exam.repository.QuestionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ExamService {

  private static final Set<String> ALLOWED_EXAM_STATUSES = Set.of("created", "active", "archived");
  private static final Set<String> ALLOWED_QUESTION_TYPES = Set.of("mcq", "true_false", "integer");
  private static final SecureRandom RANDOM = new SecureRandom();

  private final ExamRepository examRepository;
  private final QuestionRepository questionRepository;
  private final QuestionOptionRepository questionOptionRepository;

  public ExamService(
      ExamRepository examRepository,
      QuestionRepository questionRepository,
      QuestionOptionRepository questionOptionRepository
  ) {
    this.examRepository = examRepository;
    this.questionRepository = questionRepository;
    this.questionOptionRepository = questionOptionRepository;
  }

  public List<ExamSummaryDto> getAllExams() {
    return examRepository.findAllByOrderByCreatedAtDesc()
        .stream()
        .map(this::toSummaryDto)
        .toList();
  }

  public ExamDto getExamById(String examId) {
    Exam exam = examRepository.findById(examId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EXAM_NOT_FOUND", "Exam not found"));

    List<Question> questions = questionRepository.findByExamIdOrderByOrderIndexAsc(examId);
    List<String> questionIds = questions.stream().map(Question::getId).toList();
    Map<String, List<QuestionOption>> optionsByQuestionId = new HashMap<>();

    if (!questionIds.isEmpty()) {
      List<QuestionOption> options = questionOptionRepository.findByQuestionIdInOrderByOrderIndexAsc(questionIds);
      for (QuestionOption option : options) {
        optionsByQuestionId.computeIfAbsent(option.getQuestionId(), ignored -> new ArrayList<>()).add(option);
      }
    }

    return toExamDto(exam, questions, optionsByQuestionId);
  }

  @Transactional
  public ExamDto createExam(CreateExamRequest request) {
    String examId = normalizeId(request.id(), "exam");
    String status = normalizeExamStatus(request.status() == null ? "created" : request.status());

    Exam exam = Exam.builder()
        .id(examId)
        .title(request.title().trim())
        .description(request.description() == null ? "" : request.description().trim())
        .durationMinutes(request.durationMinutes())
        .passingPercentage(request.passingPercentage())
        .createdBy(request.createdBy().trim())
        .status(status)
        .build();

    examRepository.save(exam);

    if (request.questions() != null) {
      for (int i = 0; i < request.questions().size(); i++) {
        CreateExamQuestionRequest questionRequest = request.questions().get(i);
        String questionId = normalizeId(questionRequest.id(), "q");
        String questionType = normalizeQuestionType(questionRequest.type());

        Question question = Question.builder()
            .id(questionId)
            .examId(examId)
            .text(questionRequest.text().trim())
            .type(questionType)
            .marks(questionRequest.marks())
            .orderIndex(questionRequest.orderIndex() == null ? i : questionRequest.orderIndex())
            .build();

        applyCorrectAnswer(question, questionType, questionRequest.correctAnswer());
        questionRepository.save(question);

        List<CreateExamOptionRequest> optionRequests = questionRequest.options();
        if (optionRequests != null) {
          for (int j = 0; j < optionRequests.size(); j++) {
            CreateExamOptionRequest optionRequest = optionRequests.get(j);

            QuestionOption option = QuestionOption.builder()
                .id(normalizeId(optionRequest.id(), "opt"))
                .questionId(questionId)
                .text(optionRequest.text().trim())
                .isCorrect(optionRequest.isCorrect())
                .orderIndex(optionRequest.orderIndex() == null ? j : optionRequest.orderIndex())
                .build();

            questionOptionRepository.save(option);
          }
        }
      }
    }

    return getExamById(examId);
  }

  @Transactional
  public ExamDto updateExam(String examId, UpdateExamRequest request) {
    Exam exam = examRepository.findById(examId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "EXAM_NOT_FOUND", "Exam not found"));

    if (request.title() != null) {
      exam.setTitle(request.title().trim());
    }
    if (request.description() != null) {
      exam.setDescription(request.description().trim());
    }
    if (request.durationMinutes() != null) {
      exam.setDurationMinutes(request.durationMinutes());
    }
    if (request.passingPercentage() != null) {
      exam.setPassingPercentage(request.passingPercentage());
    }
    if (request.status() != null) {
      exam.setStatus(normalizeExamStatus(request.status()));
    }

    examRepository.save(exam);
    return getExamById(examId);
  }

  @Transactional
  public void deleteExam(String examId) {
    if (!examRepository.existsById(examId)) {
      throw new ApiException(HttpStatus.NOT_FOUND, "EXAM_NOT_FOUND", "Exam not found");
    }
    examRepository.deleteById(examId);
  }

  private ExamSummaryDto toSummaryDto(Exam exam) {
    return new ExamSummaryDto(
        exam.getId(),
        exam.getTitle(),
        exam.getDescription(),
        exam.getDurationMinutes(),
        exam.getPassingPercentage(),
        exam.getCreatedBy(),
        exam.getStatus(),
        exam.getCreatedAt(),
        exam.getUpdatedAt()
    );
  }

  private ExamDto toExamDto(Exam exam, List<Question> questions, Map<String, List<QuestionOption>> optionsByQuestionId) {
    List<ExamQuestionDto> questionDtos = questions.stream()
        .map(question -> {
          List<ExamOptionDto> optionDtos = optionsByQuestionId
              .getOrDefault(question.getId(), List.of())
              .stream()
              .map(option -> new ExamOptionDto(option.getId(), option.getText(), option.getIsCorrect()))
              .toList();

          return new ExamQuestionDto(
              question.getId(),
              question.getText(),
              question.getType(),
              question.getMarks(),
              question.getOrderIndex(),
              optionDtos,
              extractCorrectAnswer(question)
          );
        })
        .toList();

    return new ExamDto(
        exam.getId(),
        exam.getTitle(),
        exam.getDescription(),
        exam.getDurationMinutes(),
        exam.getPassingPercentage(),
        exam.getCreatedBy(),
        exam.getStatus(),
        questionDtos,
        exam.getCreatedAt(),
        exam.getUpdatedAt()
    );
  }

  private void applyCorrectAnswer(Question question, String questionType, JsonNode correctAnswerNode) {
    if (correctAnswerNode == null || correctAnswerNode.isNull()) {
      return;
    }

    switch (questionType) {
      case "true_false" -> {
        boolean parsed = correctAnswerNode.isBoolean()
            ? correctAnswerNode.asBoolean()
            : Boolean.parseBoolean(correctAnswerNode.asText());
        question.setCorrectAnswerBool(parsed);
      }
      case "integer" -> {
        try {
          question.setCorrectAnswerNumber(new BigDecimal(correctAnswerNode.asText()));
        } catch (NumberFormatException ex) {
          throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid integer correctAnswer");
        }
      }
      default -> question.setCorrectAnswerText(correctAnswerNode.asText());
    }
  }

  private Object extractCorrectAnswer(Question question) {
    return switch (question.getType()) {
      case "true_false" -> question.getCorrectAnswerBool();
      case "integer" -> question.getCorrectAnswerNumber();
      default -> question.getCorrectAnswerText();
    };
  }

  private String normalizeExamStatus(String status) {
    String normalized = status.trim().toLowerCase(Locale.ROOT);
    if (!ALLOWED_EXAM_STATUSES.contains(normalized)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid exam status");
    }
    return normalized;
  }

  private String normalizeQuestionType(String type) {
    String normalized = type.trim().toLowerCase(Locale.ROOT);
    if (!ALLOWED_QUESTION_TYPES.contains(normalized)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid question type");
    }
    return normalized;
  }

  private String normalizeId(String source, String prefix) {
    if (source != null && !source.isBlank()) {
      return source.trim();
    }
    return prefix + "-" + System.currentTimeMillis() + "-" + Integer.toHexString(RANDOM.nextInt(1_000_000));
  }
}
