package com.examarchitect.backend.exam.controller;

import com.examarchitect.backend.exam.dto.CreateExamRequest;
import com.examarchitect.backend.exam.dto.ExamDto;
import com.examarchitect.backend.exam.dto.ExamSummaryDto;
import com.examarchitect.backend.exam.dto.UpdateExamRequest;
import com.examarchitect.backend.exam.service.ExamService;
import com.examarchitect.backend.common.security.AccessControlService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/exams")
public class ExamController {

  private final ExamService examService;
  private final AccessControlService accessControlService;

  public ExamController(ExamService examService, AccessControlService accessControlService) {
    this.examService = examService;
    this.accessControlService = accessControlService;
  }

  @GetMapping
  public ResponseEntity<List<ExamSummaryDto>> getExams(
      @RequestHeader(name = "X-User-Id", required = false) String userId
  ) {
    accessControlService.requireAuthenticated(userId);
    return ResponseEntity.ok(examService.getAllExams());
  }

  @GetMapping("/{examId}")
  public ResponseEntity<ExamDto> getExamById(
      @PathVariable String examId,
      @RequestHeader(name = "X-User-Id", required = false) String userId
  ) {
    accessControlService.requireAuthenticated(userId);
    return ResponseEntity.ok(examService.getExamById(examId));
  }

  @PostMapping
  public ResponseEntity<ExamDto> createExam(
      @Valid @RequestBody CreateExamRequest request,
      @RequestHeader(name = "X-User-Id", required = false) String userId
  ) {
    accessControlService.requireAdmin(userId);
    return ResponseEntity.ok(examService.createExam(request));
  }

  @PatchMapping("/{examId}")
  public ResponseEntity<ExamDto> updateExam(
      @PathVariable String examId,
      @Valid @RequestBody UpdateExamRequest request,
      @RequestHeader(name = "X-User-Id", required = false) String userId
  ) {
    accessControlService.requireAdmin(userId);
    return ResponseEntity.ok(examService.updateExam(examId, request));
  }

  @DeleteMapping("/{examId}")
  public ResponseEntity<Void> deleteExam(
      @PathVariable String examId,
      @RequestHeader(name = "X-User-Id", required = false) String userId
  ) {
    accessControlService.requireAdmin(userId);
    examService.deleteExam(examId);
    return ResponseEntity.noContent().build();
  }
}
