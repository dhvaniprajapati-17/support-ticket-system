package com.dhvaniprajapati.tickets.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.TypeMismatchException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.exc.InvalidFormatException;

import java.util.Arrays;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * Turns exceptions thrown while handling a request into RFC 9457 "problem detail" JSON responses.
 *
 * Extending ResponseEntityExceptionHandler gives us ProblemDetail responses for all of Spring MVC's
 * built-in errors (405 wrong method, 415 wrong content type, 404 unknown URL, missing parameters, ...).
 * We only override the ones where we want a clearer message, and add handlers for our own exceptions.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Unknown ticket id -> 404. */
    @ExceptionHandler(TicketNotFoundException.class)
    public ProblemDetail handleTicketNotFound(TicketNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Ticket not found");
        return problem;
    }

    /** @Valid failed on a request body -> 400 with an "errors" map of field -> message. */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        // TreeMap keeps fields in alphabetical order; a field with several errors gets them joined.
        Map<String, String> errors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        error -> String.valueOf(error.getDefaultMessage()),
                        (first, second) -> first + "; " + second,
                        TreeMap::new));

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "One or more fields are invalid.");
        problem.setTitle("Validation failed");
        problem.setProperty("errors", errors);
        return ResponseEntity.badRequest().body(problem);
    }

    /** Request body could not be turned into Java: malformed JSON, or a value like "priority": "URGENT". */
    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);

        if (ex.getCause() instanceof InvalidFormatException ife && ife.getTargetType().isEnum()) {
            String field = ife.getPath().isEmpty() ? "value" : ife.getPath().getLast().getPropertyName();
            problem.setTitle("Invalid value");
            problem.setDetail("Invalid value '%s' for field '%s'. Allowed values: %s."
                    .formatted(ife.getValue(), field, allowedValues(ife.getTargetType())));
            problem.setProperty("errors", Map.of(field, "must be one of " + allowedValues(ife.getTargetType())));
        } else if (ex.getCause() instanceof JacksonException) {
            problem.setTitle("Malformed JSON");
            problem.setDetail("The request body is not valid JSON.");
        } else {
            problem.setTitle("Unreadable request body");
            problem.setDetail("The request body is missing or could not be read.");
        }
        return ResponseEntity.badRequest().body(problem);
    }

    /** A path or query parameter has the wrong type, e.g. /api/tickets/abc or ?status=CLOSED. */
    @Override
    protected ResponseEntity<Object> handleTypeMismatch(
            TypeMismatchException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        String name = ex.getPropertyName() != null ? ex.getPropertyName() : "parameter";
        Class<?> type = ex.getRequiredType();

        String detail = (type != null && type.isEnum())
                ? "Invalid value '%s' for '%s'. Allowed values: %s.".formatted(ex.getValue(), name, allowedValues(type))
                : "Invalid value '%s' for '%s'.".formatted(ex.getValue(), name);

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
        problem.setTitle("Invalid parameter");
        return ResponseEntity.badRequest().body(problem);
    }

    /** Anything unexpected -> 500. Log the details for us, but don't leak them to the client. */
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred.");
        problem.setTitle("Internal server error");
        return problem;
    }

    private static String allowedValues(Class<?> enumType) {
        return Arrays.toString(enumType.getEnumConstants());
    }
}
