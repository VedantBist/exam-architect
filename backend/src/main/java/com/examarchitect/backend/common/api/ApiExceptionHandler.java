package com.examarchitect.backend.common.api;

import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ApiError> handleApiException(ApiException ex) {
    return ResponseEntity
        .status(ex.getStatus())
        .body(new ApiError(ex.getCode(), ex.getMessage(), ex.getDetails()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
    Map<String, String> details = new HashMap<>();
    for (FieldError error : ex.getBindingResult().getFieldErrors()) {
      details.put(error.getField(), error.getDefaultMessage());
    }

    return ResponseEntity
        .status(HttpStatus.BAD_REQUEST)
        .body(new ApiError("VALIDATION_ERROR", "Validation failed", details));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiError> handleUnexpected(Exception ex) {
    return ResponseEntity
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(new ApiError("INTERNAL_ERROR", "Unexpected server error", null));
  }
}
