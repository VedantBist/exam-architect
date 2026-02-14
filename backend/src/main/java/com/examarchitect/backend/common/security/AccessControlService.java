package com.examarchitect.backend.common.security;

import com.examarchitect.backend.auth.model.UserAccount;
import com.examarchitect.backend.auth.repository.UserAccountRepository;
import com.examarchitect.backend.common.api.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class AccessControlService {

  private final UserAccountRepository userAccountRepository;

  public AccessControlService(UserAccountRepository userAccountRepository) {
    this.userAccountRepository = userAccountRepository;
  }

  public UserAccount requireAuthenticated(String userId) {
    if (userId == null || userId.isBlank()) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_UNAUTHORIZED", "Missing user context");
    }

    return userAccountRepository.findById(userId)
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_UNAUTHORIZED", "Invalid user context"));
  }

  public UserAccount requireAdmin(String userId) {
    UserAccount actor = requireAuthenticated(userId);
    if (!"admin".equals(actor.getRole())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "AUTH_FORBIDDEN", "Admin role is required");
    }
    return actor;
  }

  public UserAccount requireStudent(String userId) {
    UserAccount actor = requireAuthenticated(userId);
    if (!"student".equals(actor.getRole())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "AUTH_FORBIDDEN", "Student role is required");
    }
    return actor;
  }

  public void requireSameUser(String expectedUserId, UserAccount actor) {
    if (expectedUserId == null || expectedUserId.isBlank() || !expectedUserId.equals(actor.getId())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "AUTH_FORBIDDEN", "You can only access your own records");
    }
  }
}
