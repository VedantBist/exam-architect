package com.examarchitect.backend.auth.controller;

import static org.mockito.Mockito.when;
import static org.springframework.http.HttpStatus.UNAUTHORIZED;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.examarchitect.backend.auth.dto.AuthResponse;
import com.examarchitect.backend.auth.dto.AuthUserDto;
import com.examarchitect.backend.auth.service.AuthService;
import com.examarchitect.backend.common.api.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AuthController.class)
class AuthControllerWebMvcTest {

  @Autowired
  private MockMvc mockMvc;

  @MockBean
  private AuthService authService;

  @Test
  void loginShouldReturnValidationErrorForInvalidPayload() throws Exception {
    mockMvc.perform(post("/api/v1/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"email":"not-an-email","password":""}
                """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
        .andExpect(jsonPath("$.message").value("Validation failed"))
        .andExpect(jsonPath("$.details.email").exists())
        .andExpect(jsonPath("$.details.password").exists());
  }

  @Test
  void loginShouldReturnAuthErrorContract() throws Exception {
    when(authService.login(org.mockito.ArgumentMatchers.any()))
        .thenThrow(new ApiException(UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS", "Invalid email or password"));

    mockMvc.perform(post("/api/v1/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("""
                {"email":"student@example.com","password":"badpass"}
                """))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"))
        .andExpect(jsonPath("$.message").value("Invalid email or password"));
  }

  @Test
  void meShouldReturnCurrentUser() throws Exception {
    when(authService.me("student-001"))
        .thenReturn(new AuthResponse(new AuthUserDto(
            "student-001",
            "student@example.com",
            "Student User",
            "student"
        )));

    mockMvc.perform(get("/api/v1/auth/me").header("X-User-Id", "student-001"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.user.id").value("student-001"))
        .andExpect(jsonPath("$.user.email").value("student@example.com"))
        .andExpect(jsonPath("$.user.fullName").value("Student User"))
        .andExpect(jsonPath("$.user.role").value("student"));
  }
}
