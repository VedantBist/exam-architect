package com.examarchitect.backend.exam.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
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
@Table(name = "exams")
public class Exam {

  @Id
  @Column(name = "id", nullable = false, length = 128)
  private String id;

  @Column(name = "title", nullable = false, length = 255)
  private String title;

  @Column(name = "description", nullable = false, columnDefinition = "text")
  private String description;

  @Column(name = "duration_minutes", nullable = false)
  private Integer durationMinutes;

  @Column(name = "passing_percentage", nullable = false)
  private Integer passingPercentage;

  @Column(name = "created_by", nullable = false, length = 128)
  private String createdBy;

  @Column(name = "status", nullable = false, length = 20)
  private String status;

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
