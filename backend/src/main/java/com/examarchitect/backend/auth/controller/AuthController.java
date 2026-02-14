package com.examarchitect.backend.auth.controller;

import com.examarchitect.backend.auth.dto.AuthResponse;
import com.examarchitect.backend.auth.dto.LoginRequest;
import com.examarchitect.backend.auth.dto.SignupRequest;
import com.examarchitect.backend.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
    return ResponseEntity.ok(authService.login(request));
  }

  @PostMapping("/signup")
  public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
    return ResponseEntity.ok(authService.signup(request));
  }

  @PostMapping("/logout")
  public ResponseEntity<Void> logout() {
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/me")
  public ResponseEntity<AuthResponse> me(@RequestHeader(name = "X-User-Id", required = false) String userId) {
    return ResponseEntity.ok(authService.me(userId));
  }
}
