package com.examarchitect.backend.exam.repository;

import com.examarchitect.backend.exam.model.Exam;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamRepository extends JpaRepository<Exam, String> {

  List<Exam> findAllByOrderByCreatedAtDesc();
}
