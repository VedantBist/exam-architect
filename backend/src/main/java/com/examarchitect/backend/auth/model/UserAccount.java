package com.examarchitect.backend.auth.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
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
@Table(name = "users")
public class UserAccount {

  @Id
  @Column(name = "id", nullable = false, length = 128)
  private String id;

  @Column(name = "email", nullable = false, unique = true, length = 255)
  private String email;

  @Column(name = "full_name", nullable = false, length = 255)
  private String fullName;

  @Column(name = "role", nullable = false, length = 20)
  private String role;

  @Column(name = "password_hash", nullable = false, length = 255)
  private String passwordHash;

  @Column(name = "created_at", nullable = false)
  private OffsetDateTime createdAt;

  @PrePersist
  void prePersist() {
    if (createdAt == null) {
      createdAt = OffsetDateTime.now();
    }
  }
}
