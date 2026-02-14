package com.examarchitect.backend.exam.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "question_options")
public class QuestionOption {

  @Id
  @Column(name = "id", nullable = false, length = 128)
  private String id;

  @Column(name = "question_id", nullable = false, length = 128)
  private String questionId;

  @Column(name = "text", nullable = false, columnDefinition = "text")
  private String text;

  @Column(name = "is_correct", nullable = false)
  private Boolean isCorrect;

  @Column(name = "order_index", nullable = false)
  private Integer orderIndex;
}
