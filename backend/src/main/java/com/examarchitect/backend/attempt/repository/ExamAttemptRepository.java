package com.examarchitect.backend.attempt.repository;

import com.examarchitect.backend.attempt.model.ExamAttempt;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, String> {

  List<ExamAttempt> findByStudentIdOrderByStartedAtDesc(String studentId);

  Optional<ExamAttempt> findByExamIdAndStudentId(String examId, String studentId);
}
