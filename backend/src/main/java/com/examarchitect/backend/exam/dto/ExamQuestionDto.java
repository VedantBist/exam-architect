package com.examarchitect.backend.exam.dto;

import java.util.List;

public record ExamQuestionDto(
    String id,
    String text,
    String type,
    String subject,
    Integer marks,
    Integer orderIndex,
    List<ExamOptionDto> options,
    Object correctAnswer
) {
}
