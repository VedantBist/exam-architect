package com.examarchitect.backend.auth.service;

import com.examarchitect.backend.auth.dto.AuthResponse;
import com.examarchitect.backend.auth.dto.AuthUserDto;
import com.examarchitect.backend.auth.dto.LoginRequest;
import com.examarchitect.backend.auth.dto.SignupRequest;
import com.examarchitect.backend.auth.model.UserAccount;
import com.examarchitect.backend.auth.repository.UserAccountRepository;
import com.examarchitect.backend.common.api.ApiException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

  private static final SecureRandom RANDOM = new SecureRandom();

  private final UserAccountRepository userAccountRepository;

  public AuthService(UserAccountRepository userAccountRepository) {
    this.userAccountRepository = userAccountRepository;
  }

  public AuthResponse login(LoginRequest request) {
    UserAccount user = userAccountRepository.findByEmailIgnoreCase(request.email())
        .orElseThrow(() -> new ApiException(
            HttpStatus.UNAUTHORIZED,
            "AUTH_INVALID_CREDENTIALS",
            "Invalid email or password"
        ));

    if (!user.getPasswordHash().equals(request.password())) {
      throw new ApiException(
          HttpStatus.UNAUTHORIZED,
          "AUTH_INVALID_CREDENTIALS",
          "Invalid email or password"
      );
    }

    return new AuthResponse(toAuthUser(user));
  }

  @Transactional
  public AuthResponse signup(SignupRequest request) {
    String normalizedEmail = request.email().trim().toLowerCase();
    String normalizedRole = request.role().trim().toLowerCase();

    if (!normalizedRole.equals("admin") && !normalizedRole.equals("student")) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Role must be admin or student");
    }

    if (userAccountRepository.existsByEmailIgnoreCase(normalizedEmail)) {
      throw new ApiException(HttpStatus.CONFLICT, "AUTH_EMAIL_EXISTS", "Email is already registered");
    }

    UserAccount user = UserAccount.builder()
        .id(generateUserId())
        .email(normalizedEmail)
        .fullName(request.fullName().trim())
        .role(normalizedRole)
        .passwordHash(request.password())
        .createdAt(OffsetDateTime.now())
        .build();

    UserAccount saved = userAccountRepository.save(user);
    return new AuthResponse(toAuthUser(saved));
  }

  public AuthResponse me(String userId) {
    if (userId == null || userId.isBlank()) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_UNAUTHORIZED", "Missing user context");
    }

    UserAccount user = userAccountRepository.findById(userId)
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_UNAUTHORIZED", "Invalid user context"));

    return new AuthResponse(toAuthUser(user));
  }

  private AuthUserDto toAuthUser(UserAccount user) {
    return new AuthUserDto(user.getId(), user.getEmail(), user.getFullName(), user.getRole());
  }

  private String generateUserId() {
    return "user-" + System.currentTimeMillis() + "-" + Integer.toHexString(RANDOM.nextInt(1_000_000));
  }
}
