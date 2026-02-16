package com.examarchitect.backend.insights.controller;

import com.examarchitect.backend.auth.model.UserAccount;
import com.examarchitect.backend.common.security.AccessControlService;
import com.examarchitect.backend.insights.dto.AdminInsightsDto;
import com.examarchitect.backend.insights.dto.StudentInsightsDto;
import com.examarchitect.backend.insights.service.InsightsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/insights")
public class InsightsController {

  private final InsightsService insightsService;
  private final AccessControlService accessControlService;

  public InsightsController(InsightsService insightsService, AccessControlService accessControlService) {
    this.insightsService = insightsService;
    this.accessControlService = accessControlService;
  }

  @GetMapping("/student/{studentId}")
  public ResponseEntity<StudentInsightsDto> getStudentInsights(
      @PathVariable String studentId,
      @RequestHeader(name = "X-User-Id", required = false) String userId
  ) {
    UserAccount actor = accessControlService.requireAuthenticated(userId);
    if ("student".equals(actor.getRole())) {
      accessControlService.requireSameUser(studentId, actor);
    }
    return ResponseEntity.ok(insightsService.getStudentInsights(studentId));
  }

  @GetMapping("/admin/overview")
  public ResponseEntity<AdminInsightsDto> getAdminOverview(
      @RequestHeader(name = "X-User-Id", required = false) String userId
  ) {
    accessControlService.requireAdmin(userId);
    return ResponseEntity.ok(insightsService.getAdminOverview());
  }
}
