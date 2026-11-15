package gg.overlab.backend.exception.api;

import gg.overlab.backend.exception.core.ApiException;
import io.sentry.Sentry;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.bind.ServletRequestBindingException;
import org.springframework.web.context.request.async.AsyncRequestTimeoutException;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@Slf4j
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ApiErrorHandler {

    private static final String NO_STORE = "no-store";
    private static final Set<String> CONFLICT_SQL_STATES = Set.of("23505", "23503");

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiError> handleApiException(ApiException exception, HttpServletRequest request) {
        return build(exception.status(), exception.getMessage(), request, List.of());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> handleUploadTooLarge(MaxUploadSizeExceededException exception,
                                                         HttpServletRequest request) {
        return build(HttpStatus.PAYLOAD_TOO_LARGE, "The uploaded file is too large", request, List.of());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleDataIntegrity(DataIntegrityViolationException exception,
                                                        HttpServletRequest request) {
        if (isConflictWithExistingData(exception)) {
            log.warn("Data integrity violation on {}: {}", request.getRequestURI(),
                    exception.getMostSpecificCause().getMessage());
            return build(HttpStatus.CONFLICT, "Request conflicts with existing data", request, List.of());
        }
        log.error("Unexpected data integrity violation on {}", request.getRequestURI(), exception);
        Sentry.captureException(exception);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", request, List.of());
    }

    private static boolean isConflictWithExistingData(DataIntegrityViolationException exception) {
        for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
            if (cause instanceof SQLException sqlException && sqlException.getSQLState() != null
                    && CONFLICT_SQL_STATES.contains(sqlException.getSQLState())) {
                return true;
            }
        }
        return false;
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiError> handleNoResource(NoResourceFoundException exception, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, "Resource not found", request, List.of());
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException exception,
                                                       HttpServletRequest request) {
        ApiError.SubError subError = new ApiError.SubError(exception.getName(), "Invalid value");
        return build(HttpStatus.BAD_REQUEST, "Invalid request parameter", request, List.of(subError));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiError> handleMissingParameter(MissingServletRequestParameterException exception,
                                                           HttpServletRequest request) {
        ApiError.SubError subError = new ApiError.SubError(exception.getParameterName(), "Parameter is required");
        return build(HttpStatus.BAD_REQUEST, "Missing request parameter", request, List.of(subError));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException exception,
                                                              HttpServletRequest request) {
        List<ApiError.SubError> subErrors = exception.getConstraintViolations().stream()
                .map(violation -> new ApiError.SubError(violation.getPropertyPath().toString(), violation.getMessage()))
                .toList();
        return build(HttpStatus.BAD_REQUEST, "Validation failed", request, subErrors);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleInvalidBody(MethodArgumentNotValidException exception,
                                                      HttpServletRequest request) {
        List<ApiError.SubError> subErrors = exception.getBindingResult().getFieldErrors().stream()
                .map(error -> new ApiError.SubError(error.getField(),
                        error.isBindingFailure() ? "Invalid value" : error.getDefaultMessage()))
                .toList();
        return build(HttpStatus.BAD_REQUEST, "Validation failed", request, subErrors);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleUnreadableBody(HttpMessageNotReadableException exception,
                                                         HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Malformed request body", request, List.of());
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiError> handleMethodNotAllowed(HttpRequestMethodNotSupportedException exception,
                                                           HttpServletRequest request) {
        return build(HttpStatus.METHOD_NOT_ALLOWED, "Method not allowed", request, List.of());
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ApiError> handleUnsupportedMediaType(HttpMediaTypeNotSupportedException exception,
                                                               HttpServletRequest request) {
        return build(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Unsupported content type", request, List.of());
    }

    @ExceptionHandler(HttpMediaTypeNotAcceptableException.class)
    public ResponseEntity<ApiError> handleNotAcceptable(HttpMediaTypeNotAcceptableException exception,
                                                        HttpServletRequest request) {
        return build(HttpStatus.NOT_ACCEPTABLE, "Not acceptable", request, List.of());
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ApiError> handleMissingPart(MissingServletRequestPartException exception,
                                                      HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Missing request part: " + exception.getRequestPartName(), request,
                List.of());
    }

    @ExceptionHandler({ErrorResponseException.class, ServletRequestBindingException.class,
            HandlerMethodValidationException.class, AsyncRequestTimeoutException.class, MultipartException.class})
    public ResponseEntity<ApiError> handleErrorResponse(Exception exception, HttpServletRequest request) {
        HttpStatus status = statusOf(exception);
        if (status.is5xxServerError()) {
            log.error("Request failed on {}", request.getRequestURI(), exception);
            Sentry.captureException(exception);
        }
        return build(status, status.is5xxServerError() ? "Internal server error" : "Request failed", request,
                List.of());
    }

    private static HttpStatus statusOf(Exception exception) {
        int code = exception instanceof ErrorResponse errorResponse
                ? errorResponse.getStatusCode().value() : HttpStatus.BAD_REQUEST.value();
        try {
            return HttpStatus.valueOf(code);
        } catch (IllegalArgumentException unknownCode) {
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception exception, HttpServletRequest request) {
        log.error("Unhandled exception on {}", request.getRequestURI(), exception);
        Sentry.captureException(exception);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", request, List.of());
    }

    private ResponseEntity<ApiError> build(HttpStatus status, String message, HttpServletRequest request,
                                           List<ApiError.SubError> subErrors) {
        ApiError body = new ApiError(status.getReasonPhrase(), status.value(), Instant.now(), message,
                request.getRequestURI(), subErrors);
        overridePublicCacheHeader();
        return ResponseEntity.status(status).header(HttpHeaders.CACHE_CONTROL, NO_STORE).body(body);
    }

    private void overridePublicCacheHeader() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes
                && attributes.getResponse() != null) {
            attributes.getResponse().setHeader(HttpHeaders.CACHE_CONTROL, NO_STORE);
        }
    }
}
