package com.examarchitect.backend.insights.service;

import com.examarchitect.backend.attempt.model.ExamAttempt;
import com.examarchitect.backend.attempt.repository.ExamAttemptRepository;
import com.examarchitect.backend.exam.model.Exam;
import com.examarchitect.backend.exam.model.Question;
import com.examarchitect.backend.exam.repository.ExamRepository;
import com.examarchitect.backend.exam.repository.QuestionRepository;
import com.examarchitect.backend.insights.dto.AdminInsightsDto;
import com.examarchitect.backend.insights.dto.AtRiskStudentInsightDto;
import com.examarchitect.backend.insights.dto.DailyTrendInsightDto;
import com.examarchitect.backend.insights.dto.ExamDifficultyInsightDto;
import com.examarchitect.backend.insights.dto.QuestionTypeInsightDto;
import com.examarchitect.backend.insights.dto.RecentAttemptInsightDto;
import com.examarchitect.backend.insights.dto.StudentInsightsDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class InsightsService {

  private static final String SUBMITTED_STATUS = "submitted";
  private static final BigDecimal DEFAULT_PASSING_PERCENTAGE = BigDecimal.valueOf(40);

  private final ExamAttemptRepository examAttemptRepository;
  private final ExamRepository examRepository;
  private final QuestionRepository questionRepository;
  private final ObjectMapper objectMapper;

  public InsightsService(
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

  public StudentInsightsDto getStudentInsights(String studentId) {
    List<ExamAttempt> submittedAttempts = examAttemptRepository.findByStudentIdOrderByStartedAtDesc(studentId)
        .stream()
        .filter(this::isSubmittedAttempt)
        .sorted(Comparator.comparing(ExamAttempt::getSubmittedAt).reversed())
        .toList();

    if (submittedAttempts.isEmpty()) {
      return new StudentInsightsDto(
          studentId,
          null,
          0,
          0,
          0,
          0,
          0,
          "insufficient_data",
          null,
          null,
          List.of(),
          List.of("Complete at least one exam submission to unlock personalized AI insights.")
      );
    }

    String studentName = submittedAttempts.get(0).getStudentName();
    Map<String, Exam> examsById = buildExamLookup(submittedAttempts);
    Map<String, List<Question>> questionsByExamId = buildQuestionLookup(submittedAttempts);

    double averagePercentage = round2(submittedAttempts.stream()
        .map(ExamAttempt::getPercentage)
        .filter(Objects::nonNull)
        .mapToDouble(BigDecimal::doubleValue)
        .average()
        .orElse(0));

    double latestPercentage = round2(Optional.ofNullable(submittedAttempts.get(0).getPercentage())
        .map(BigDecimal::doubleValue)
        .orElse(0.0));

    double passRate = round2(
        submittedAttempts.stream()
            .filter(attempt -> isPassingAttempt(attempt, examsById.get(attempt.getExamId())))
            .count() * 100.0 / submittedAttempts.size()
    );

    double predictedNextPercentage = predictNextPercentage(submittedAttempts);
    String trend = computeTrendLabel(submittedAttempts);

    Map<String, AccuracyCounter> accuracyByType = calculateQuestionTypeAccuracy(
        submittedAttempts,
        questionsByExamId
    );
    QuestionTypeInsightDto strongest = selectQuestionTypeInsight(accuracyByType, Comparator.comparingDouble(
        (QuestionTypeInsightDto dto) -> dto.accuracy()
    ).thenComparingLong(QuestionTypeInsightDto::total).reversed());
    QuestionTypeInsightDto weakest = selectQuestionTypeInsight(accuracyByType, Comparator.comparingDouble(
        QuestionTypeInsightDto::accuracy
    ).thenComparingLong(QuestionTypeInsightDto::total));

    List<RecentAttemptInsightDto> recentAttempts = submittedAttempts.stream()
        .limit(5)
        .map(attempt -> {
          Exam exam = examsById.get(attempt.getExamId());
          return new RecentAttemptInsightDto(
              attempt.getId(),
              attempt.getExamId(),
              exam != null ? exam.getTitle() : attempt.getExamId(),
              round2(Optional.ofNullable(attempt.getPercentage()).map(BigDecimal::doubleValue).orElse(0.0)),
              isPassingAttempt(attempt, exam),
              attempt.getSubmittedAt()
          );
        })
        .toList();

    List<String> recommendations = buildStudentRecommendations(
        submittedAttempts.size(),
        passRate,
        trend,
        weakest
    );

    return new StudentInsightsDto(
        studentId,
        studentName,
        submittedAttempts.size(),
        averagePercentage,
        latestPercentage,
        passRate,
        predictedNextPercentage,
        trend,
        strongest,
        weakest,
        recentAttempts,
        recommendations
    );
  }

  public AdminInsightsDto getAdminOverview() {
    List<ExamAttempt> submittedAttempts = examAttemptRepository.findAll()
        .stream()
        .filter(this::isSubmittedAttempt)
        .sorted(Comparator.comparing(ExamAttempt::getSubmittedAt).reversed())
        .toList();

    if (submittedAttempts.isEmpty()) {
      return new AdminInsightsDto(
          0,
          0,
          0,
          0,
          List.of(),
          List.of(),
          buildDailyTrend(List.of(), Map.of()),
          List.of("No submitted attempts yet. Insights will populate after students submit exams.")
      );
    }

    Map<String, Exam> examsById = buildExamLookup(submittedAttempts);
    long uniqueStudents = submittedAttempts.stream()
        .map(ExamAttempt::getStudentId)
        .distinct()
        .count();

    double averagePercentage = round2(submittedAttempts.stream()
        .map(ExamAttempt::getPercentage)
        .filter(Objects::nonNull)
        .mapToDouble(BigDecimal::doubleValue)
        .average()
        .orElse(0));

    double passRate = round2(
        submittedAttempts.stream()
            .filter(attempt -> isPassingAttempt(attempt, examsById.get(attempt.getExamId())))
            .count() * 100.0 / submittedAttempts.size()
    );

    List<ExamDifficultyInsightDto> hardestExams = buildHardestExams(submittedAttempts, examsById);
    List<AtRiskStudentInsightDto> atRiskStudents = buildAtRiskStudents(submittedAttempts);
    List<DailyTrendInsightDto> recentDailyTrend = buildDailyTrend(submittedAttempts, examsById);
    List<String> recommendations = buildAdminRecommendations(passRate, hardestExams, atRiskStudents);

    return new AdminInsightsDto(
        submittedAttempts.size(),
        uniqueStudents,
        averagePercentage,
        passRate,
        atRiskStudents,
        hardestExams,
        recentDailyTrend,
        recommendations
    );
  }

  private List<ExamDifficultyInsightDto> buildHardestExams(List<ExamAttempt> attempts, Map<String, Exam> examsById) {
    return attempts.stream()
        .collect(Collectors.groupingBy(ExamAttempt::getExamId))
        .entrySet()
        .stream()
        .map(entry -> {
          String examId = entry.getKey();
          List<ExamAttempt> examAttempts = entry.getValue();
          Exam exam = examsById.get(examId);
          double average = round2(examAttempts.stream()
              .map(ExamAttempt::getPercentage)
              .filter(Objects::nonNull)
              .mapToDouble(BigDecimal::doubleValue)
              .average()
              .orElse(0));
          double examPassRate = round2(
              examAttempts.stream().filter(attempt -> isPassingAttempt(attempt, exam)).count() * 100.0 / examAttempts.size()
          );

          return new ExamDifficultyInsightDto(
              examId,
              exam != null ? exam.getTitle() : examId,
              examAttempts.size(),
              average,
              examPassRate
          );
        })
        .sorted(Comparator.comparingDouble(ExamDifficultyInsightDto::averagePercentage)
            .thenComparingDouble(ExamDifficultyInsightDto::passRate))
        .limit(5)
        .toList();
  }

  private List<AtRiskStudentInsightDto> buildAtRiskStudents(List<ExamAttempt> attempts) {
    return attempts.stream()
        .collect(Collectors.groupingBy(ExamAttempt::getStudentId))
        .entrySet()
        .stream()
        .map(entry -> {
          List<ExamAttempt> studentAttempts = entry.getValue().stream()
              .sorted(Comparator.comparing(ExamAttempt::getSubmittedAt))
              .toList();

          double average = round2(studentAttempts.stream()
              .map(ExamAttempt::getPercentage)
              .filter(Objects::nonNull)
              .mapToDouble(BigDecimal::doubleValue)
              .average()
              .orElse(0));

          return new AtRiskStudentInsightDto(
              entry.getKey(),
              studentAttempts.get(studentAttempts.size() - 1).getStudentName(),
              studentAttempts.size(),
              average,
              computeTrendLabel(studentAttempts)
          );
        })
        .filter(student -> student.averagePercentage() < 50 || "declining".equals(student.trend()))
        .sorted(Comparator.comparingDouble(AtRiskStudentInsightDto::averagePercentage))
        .limit(8)
        .toList();
  }

  private List<DailyTrendInsightDto> buildDailyTrend(List<ExamAttempt> attempts, Map<String, Exam> examsById) {
    LocalDate today = LocalDate.now(ZoneOffset.UTC);
    LocalDate startDate = today.minusDays(6);

    Map<LocalDate, List<ExamAttempt>> attemptsByDate = attempts.stream()
        .filter(attempt -> attempt.getSubmittedAt() != null)
        .collect(Collectors.groupingBy(attempt -> attempt.getSubmittedAt().toLocalDate()));

    List<DailyTrendInsightDto> trend = new ArrayList<>();
    for (int i = 0; i < 7; i++) {
      LocalDate date = startDate.plusDays(i);
      List<ExamAttempt> dailyAttempts = attemptsByDate.getOrDefault(date, List.of());

      if (dailyAttempts.isEmpty()) {
        trend.add(new DailyTrendInsightDto(date.toString(), 0, 0, 0));
        continue;
      }

      double average = round2(dailyAttempts.stream()
          .map(ExamAttempt::getPercentage)
          .filter(Objects::nonNull)
          .mapToDouble(BigDecimal::doubleValue)
          .average()
          .orElse(0));
      double dailyPassRate = round2(
          dailyAttempts.stream()
              .filter(attempt -> isPassingAttempt(attempt, examsById.get(attempt.getExamId())))
              .count() * 100.0 / dailyAttempts.size()
      );

      trend.add(new DailyTrendInsightDto(date.toString(), dailyAttempts.size(), average, dailyPassRate));
    }

    return trend;
  }

  private List<String> buildStudentRecommendations(
      long submittedAttempts,
      double passRate,
      String trend,
      QuestionTypeInsightDto weakestType
  ) {
    List<String> recommendations = new ArrayList<>();

    if (submittedAttempts < 3) {
      recommendations.add("Attempt 2-3 more exams to improve prediction confidence and trend stability.");
    }

    if (passRate < 60) {
      recommendations.add("Your pass rate is below 60%. Revisit fundamentals before taking the next timed exam.");
    }

    if (weakestType != null) {
      switch (weakestType.type()) {
        case "mcq" ->
            recommendations.add("MCQ accuracy is your weakest area. Practice elimination and distractor analysis drills.");
        case "integer" ->
            recommendations.add("Integer questions are your weakest area. Focus on unit checks and step-wise calculations.");
        case "true_false" ->
            recommendations.add("True/False accuracy is low. Review definition-based concepts and common statement traps.");
        default -> {
        }
      }
    }

    if ("declining".equals(trend)) {
      recommendations.add("Recent trend is declining. Review mistakes from the last two attempts before a new test.");
    } else if ("improving".equals(trend)) {
      recommendations.add("Your trend is improving. Increase difficulty gradually with longer or mixed-topic exams.");
    }

    if (recommendations.isEmpty()) {
      recommendations.add("Performance is stable. Maintain cadence with one full-length exam and one revision session each week.");
    }

    return recommendations.stream().limit(4).toList();
  }

  private List<String> buildAdminRecommendations(
      double overallPassRate,
      List<ExamDifficultyInsightDto> hardestExams,
      List<AtRiskStudentInsightDto> atRiskStudents
  ) {
    List<String> recommendations = new ArrayList<>();

    if (overallPassRate < 55) {
      recommendations.add("Overall pass rate is below 55%. Review exam balance and add remediation sessions.");
    }

    if (!hardestExams.isEmpty() && hardestExams.get(0).averagePercentage() < 45) {
      recommendations.add("Top hardest exam has low average performance. Audit question clarity and difficulty calibration.");
    }

    if (!atRiskStudents.isEmpty()) {
      recommendations.add("At-risk students detected. Schedule targeted revision plans for low-average or declining learners.");
    }

    if (recommendations.isEmpty()) {
      recommendations.add("Cohort performance is healthy. Continue monitoring trends and rotate mixed-difficulty assessments.");
    }

    return recommendations.stream().limit(4).toList();
  }

  private double predictNextPercentage(List<ExamAttempt> attemptsDescendingByDate) {
    List<ExamAttempt> chronological = attemptsDescendingByDate.stream()
        .sorted(Comparator.comparing(ExamAttempt::getSubmittedAt))
        .toList();

    if (chronological.isEmpty()) {
      return 0;
    }

    double weightedTotal = 0;
    int weightSum = 0;
    for (int i = 0; i < chronological.size(); i++) {
      int weight = i + 1;
      double score = Optional.ofNullable(chronological.get(i).getPercentage())
          .map(BigDecimal::doubleValue)
          .orElse(0.0);
      weightedTotal += score * weight;
      weightSum += weight;
    }

    return round2(weightSum == 0 ? 0 : weightedTotal / weightSum);
  }

  private String computeTrendLabel(List<ExamAttempt> attempts) {
    List<ExamAttempt> chronological = attempts.stream()
        .sorted(Comparator.comparing(ExamAttempt::getSubmittedAt))
        .toList();

    if (chronological.size() < 2) {
      return "insufficient_data";
    }

    int recentWindowSize = Math.min(3, chronological.size() / 2);
    if (recentWindowSize == 0) {
      recentWindowSize = 1;
    }

    List<Double> percentages = chronological.stream()
        .map(ExamAttempt::getPercentage)
        .filter(Objects::nonNull)
        .map(BigDecimal::doubleValue)
        .toList();

    if (percentages.size() < 2) {
      return "insufficient_data";
    }

    List<Double> recent = percentages.subList(percentages.size() - recentWindowSize, percentages.size());
    List<Double> previous = percentages.subList(
        Math.max(0, percentages.size() - 2 * recentWindowSize),
        percentages.size() - recentWindowSize
    );

    double previousAverage = previous.isEmpty()
        ? percentages.get(0)
        : previous.stream().mapToDouble(Double::doubleValue).average().orElse(percentages.get(0));
    double recentAverage = recent.stream().mapToDouble(Double::doubleValue).average().orElse(previousAverage);
    double delta = recentAverage - previousAverage;

    if (delta >= 3.0) {
      return "improving";
    }
    if (delta <= -3.0) {
      return "declining";
    }
    return "stable";
  }

  private QuestionTypeInsightDto selectQuestionTypeInsight(
      Map<String, AccuracyCounter> accuracyByType,
      Comparator<QuestionTypeInsightDto> comparator
  ) {
    return accuracyByType.entrySet().stream()
        .map(entry -> {
          AccuracyCounter counter = entry.getValue();
          double accuracy = counter.total == 0
              ? 0
              : counter.correct * 100.0 / counter.total;
          return new QuestionTypeInsightDto(
              entry.getKey(),
              counter.correct,
              counter.total,
              round2(accuracy)
          );
        })
        .sorted(comparator)
        .findFirst()
        .orElse(null);
  }

  private Map<String, AccuracyCounter> calculateQuestionTypeAccuracy(
      List<ExamAttempt> attempts,
      Map<String, List<Question>> questionsByExamId
  ) {
    Map<String, AccuracyCounter> accuracyByType = new LinkedHashMap<>();

    for (ExamAttempt attempt : attempts) {
      List<Question> questions = questionsByExamId.getOrDefault(attempt.getExamId(), List.of());
      if (questions.isEmpty()) {
        continue;
      }

      Map<String, Object> answers = readAnswers(attempt.getAnswersJson());
      for (Question question : questions) {
        String type = normalizeType(question.getType());
        AccuracyCounter counter = accuracyByType.computeIfAbsent(type, key -> new AccuracyCounter());
        counter.total += 1;

        Object answer = answers.get(question.getId());
        if (answer != null && isCorrectAnswer(question, answer)) {
          counter.correct += 1;
        }
      }
    }

    return accuracyByType;
  }

  private Map<String, Exam> buildExamLookup(List<ExamAttempt> attempts) {
    Set<String> examIds = attempts.stream().map(ExamAttempt::getExamId).collect(Collectors.toSet());
    if (examIds.isEmpty()) {
      return Map.of();
    }

    return examRepository.findAll()
        .stream()
        .filter(exam -> examIds.contains(exam.getId()))
        .collect(Collectors.toMap(Exam::getId, exam -> exam));
  }

  private Map<String, List<Question>> buildQuestionLookup(List<ExamAttempt> attempts) {
    List<String> examIds = attempts.stream()
        .map(ExamAttempt::getExamId)
        .distinct()
        .toList();
    if (examIds.isEmpty()) {
      return Map.of();
    }

    return questionRepository.findByExamIdInOrderByOrderIndexAsc(examIds)
        .stream()
        .collect(Collectors.groupingBy(Question::getExamId));
  }

  private boolean isSubmittedAttempt(ExamAttempt attempt) {
    return SUBMITTED_STATUS.equals(attempt.getStatus()) && attempt.getSubmittedAt() != null;
  }

  private boolean isPassingAttempt(ExamAttempt attempt, Exam exam) {
    BigDecimal percentage = Optional.ofNullable(attempt.getPercentage()).orElse(BigDecimal.ZERO);
    BigDecimal passThreshold = exam != null && exam.getPassingPercentage() != null
        ? BigDecimal.valueOf(exam.getPassingPercentage())
        : DEFAULT_PASSING_PERCENTAGE;
    return percentage.compareTo(passThreshold) >= 0;
  }

  private Map<String, Object> readAnswers(String json) {
    if (json == null || json.isBlank()) {
      return new HashMap<>();
    }

    try {
      return objectMapper.readValue(json, new TypeReference<>() {
      });
    } catch (Exception ex) {
      return new HashMap<>();
    }
  }

  private boolean isCorrectAnswer(Question question, Object answer) {
    String type = normalizeType(question.getType());

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

  private String normalizeType(String type) {
    if (type == null) {
      return "mcq";
    }
    return type.toLowerCase(Locale.ROOT);
  }

  private double round2(double value) {
    return BigDecimal.valueOf(value)
        .setScale(2, java.math.RoundingMode.HALF_UP)
        .doubleValue();
  }

  private static class AccuracyCounter {
    long correct;
    long total;
  }
}
