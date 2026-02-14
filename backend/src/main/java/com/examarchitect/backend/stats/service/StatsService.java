package com.examarchitect.backend.stats.service;

import com.examarchitect.backend.attempt.repository.ExamAttemptRepository;
import com.examarchitect.backend.exam.repository.ExamRepository;
import com.examarchitect.backend.stats.dto.ExamStatsDto;
import org.springframework.stereotype.Service;

@Service
public class StatsService {

  private final ExamRepository examRepository;
  private final ExamAttemptRepository examAttemptRepository;

  public StatsService(ExamRepository examRepository, ExamAttemptRepository examAttemptRepository) {
    this.examRepository = examRepository;
    this.examAttemptRepository = examAttemptRepository;
  }

  public ExamStatsDto getExamStats() {
    long totalExams = examRepository.count();
    long activeExams = examRepository.findAll().stream().filter(exam -> "active".equals(exam.getStatus())).count();
    long totalAttempts = examAttemptRepository.count();
    long submittedAttempts = examAttemptRepository.findAll().stream()
        .filter(attempt -> "submitted".equals(attempt.getStatus()))
        .count();

    return new ExamStatsDto(totalExams, activeExams, totalAttempts, submittedAttempts);
  }
}
