package com.examarchitect.backend.exam.repository;

import com.examarchitect.backend.exam.model.QuestionOption;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionOptionRepository extends JpaRepository<QuestionOption, String> {

  List<QuestionOption> findByQuestionIdInOrderByOrderIndexAsc(List<String> questionIds);

  List<QuestionOption> findByQuestionIdOrderByOrderIndexAsc(String questionId);
}
