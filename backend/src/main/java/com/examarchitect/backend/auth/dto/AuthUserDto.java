package com.examarchitect.backend.auth.dto;

public record AuthUserDto(
    String id,
    String email,
    String fullName,
    String role
) {
}
