package com.examarchitect.backend.exam.dto;

public record ExamOptionDto(
    String id,
    String text,
    Boolean isCorrect
) {
}
