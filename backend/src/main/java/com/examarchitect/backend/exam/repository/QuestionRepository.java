package com.examarchitect.backend.exam.repository;

import com.examarchitect.backend.exam.model.Question;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionRepository extends JpaRepository<Question, String> {

  List<Question> findByExamIdOrderByOrderIndexAsc(String examId);

  List<Question> findByExamIdInOrderByOrderIndexAsc(List<String> examIds);
}
