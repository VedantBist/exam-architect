package com.examarchitect.backend.exam.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
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
@Table(name = "questions")
public class Question {

  @Id
  @Column(name = "id", nullable = false, length = 128)
  private String id;

  @Column(name = "exam_id", nullable = false, length = 128)
  private String examId;

  @Column(name = "text", nullable = false, columnDefinition = "text")
  private String text;

  @Column(name = "type", nullable = false, length = 20)
  private String type;

  @Column(name = "subject", nullable = false, length = 64)
  private String subject;

  @Column(name = "marks", nullable = false)
  private Integer marks;

  @Column(name = "order_index", nullable = false)
  private Integer orderIndex;

  @Column(name = "correct_answer_text", columnDefinition = "text")
  private String correctAnswerText;

  @Column(name = "correct_answer_bool")
  private Boolean correctAnswerBool;

  @Column(name = "correct_answer_number", precision = 20, scale = 6)
  private BigDecimal correctAnswerNumber;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  @PrePersist
  void prePersist() {
    OffsetDateTime now = OffsetDateTime.now();
    if (createdAt == null) {
      createdAt = now;
    }
    if (updatedAt == null) {
      updatedAt = now;
    }
  }

  @PreUpdate
  void preUpdate() {
    updatedAt = OffsetDateTime.now();
  }
}
