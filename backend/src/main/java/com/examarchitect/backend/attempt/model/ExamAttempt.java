package com.examarchitect.backend.attempt.model;

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
import org.hibernate.annotations.ColumnTransformer;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "exam_attempts")
public class ExamAttempt {

  @Id
  @Column(name = "id", nullable = false, length = 128)
  private String id;

  @Column(name = "exam_id", nullable = false, length = 128)
  private String examId;

  @Column(name = "student_id", nullable = false, length = 128)
  private String studentId;

  @Column(name = "student_name", nullable = false, length = 255)
  private String studentName;

  @Column(name = "answers_json", nullable = false, columnDefinition = "jsonb")
  @ColumnTransformer(write = "?::jsonb")
  private String answersJson;

  @Column(name = "score", nullable = false)
  private Integer score;

  @Column(name = "total_marks", nullable = false)
  private Integer totalMarks;

  @Column(name = "percentage", nullable = false, precision = 7, scale = 2)
  private BigDecimal percentage;

  @Column(name = "status", nullable = false, length = 20)
  private String status;

  @Column(name = "started_at", nullable = false)
  private OffsetDateTime startedAt;

  @Column(name = "submitted_at")
  private OffsetDateTime submittedAt;

  @Column(name = "updated_at", nullable = false)
  private OffsetDateTime updatedAt;

  @PrePersist
  void prePersist() {
    OffsetDateTime now = OffsetDateTime.now();
    if (startedAt == null) {
      startedAt = now;
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
