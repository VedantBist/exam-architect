package com.examarchitect.backend.attempt.controller;

import com.examarchitect.backend.attempt.dto.CreateAttemptRequest;
import com.examarchitect.backend.attempt.dto.StudentAttemptDto;
import com.examarchitect.backend.attempt.dto.UpdateAttemptRequest;
import com.examarchitect.backend.attempt.service.AttemptService;
import com.examarchitect.backend.auth.model.UserAccount;
import com.examarchitect.backend.common.security.AccessControlService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/attempts")
public class AttemptController {

  private final AttemptService attemptService;
  private final AccessControlService accessControlService;

  public AttemptController(AttemptService attemptService, AccessControlService accessControlService) {
    this.attemptService = attemptService;
    this.accessControlService = accessControlService;
  }

  @GetMapping
  public ResponseEntity<List<StudentAttemptDto>> getAttemptsByStudent(
      @RequestParam String studentId,
      @RequestHeader(name = "X-User-Id", required = false) String userId
  ) {
    UserAccount actor = accessControlService.requireStudent(userId);
    accessControlService.requireSameUser(studentId, actor);
    return ResponseEntity.ok(attemptService.getAttemptsByStudent(studentId));
  }

  @GetMapping("/exam/{examId}")
  public ResponseEntity<Optional<StudentAttemptDto>> getAttemptByExam(
      @PathVariable String examId,
      @RequestParam String studentId,
      @RequestHeader(name = "X-User-Id", required = false) String userId
  ) {
    UserAccount actor = accessControlService.requireStudent(userId);
    accessControlService.requireSameUser(studentId, actor);
    return ResponseEntity.ok(attemptService.getAttemptByExamAndStudent(examId, studentId));
  }

  @PostMapping
  public ResponseEntity<StudentAttemptDto> createAttempt(
      @Valid @RequestBody CreateAttemptRequest request,
      @RequestHeader(name = "X-User-Id", required = false) String userId
  ) {
    UserAccount actor = accessControlService.requireStudent(userId);
    accessControlService.requireSameUser(request.studentId(), actor);
    return ResponseEntity.ok(attemptService.createAttempt(request));
  }

  @PatchMapping("/{attemptId}")
  public ResponseEntity<StudentAttemptDto> updateAttempt(
      @PathVariable String attemptId,
      @RequestBody UpdateAttemptRequest request,
      @RequestHeader(name = "X-User-Id", required = false) String userId
  ) {
    UserAccount actor = accessControlService.requireStudent(userId);
    return ResponseEntity.ok(attemptService.updateAttempt(attemptId, request, actor.getId()));
  }

  @PostMapping("/{attemptId}/submit")
  public ResponseEntity<StudentAttemptDto> submitAttempt(
      @PathVariable String attemptId,
      @RequestHeader(name = "X-User-Id", required = false) String userId
  ) {
    UserAccount actor = accessControlService.requireStudent(userId);
    return ResponseEntity.ok(attemptService.submitAttempt(attemptId, actor.getId()));
  }
}
