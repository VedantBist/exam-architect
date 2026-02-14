package com.examarchitect.backend.stats.controller;

import com.examarchitect.backend.stats.dto.ExamStatsDto;
import com.examarchitect.backend.stats.service.StatsService;
import com.examarchitect.backend.common.security.AccessControlService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/stats")
public class StatsController {

  private final StatsService statsService;
  private final AccessControlService accessControlService;

  public StatsController(StatsService statsService, AccessControlService accessControlService) {
    this.statsService = statsService;
    this.accessControlService = accessControlService;
  }

  @GetMapping("/exams")
  public ResponseEntity<ExamStatsDto> getExamStats(
      @RequestHeader(name = "X-User-Id", required = false) String userId
  ) {
    accessControlService.requireAuthenticated(userId);
    return ResponseEntity.ok(statsService.getExamStats());
  }
}
