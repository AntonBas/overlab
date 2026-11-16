package gg.overlab.backend.exception.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.exception.core.InvalidCredentialsException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import java.util.Set;
import org.junit.jupiter.api.Test;
import java.sql.SQLException;
import org.apache.catalina.connector.ClientAbortException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.CannotGetJdbcConnectionException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.mock.http.MockHttpInputMessage;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.ErrorResponseException;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

class ApiErrorHandlerTest {

    private final ApiErrorHandler handler = new ApiErrorHandler();
    private final MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/test");

    private void assertError(ResponseEntity<ApiError> response, HttpStatus status, String message) {
        assertThat(response.getStatusCode()).isEqualTo(status);
        assertThat(response.getHeaders().getCacheControl()).isEqualTo("no-store");
        ApiError body = response.getBody();
        assertThat(body).isNotNull();
        assertThat(body.statusCode()).isEqualTo(status.value());
        assertThat(body.path()).isEqualTo("/api/test");
        assertThat(body.message()).isEqualTo(message);
    }

    @Test
    void domainExceptionsUseTheirOwnStatus() {
        assertError(handler.handleApiException(new EntityNotFoundException("Hero", "x"), request),
                HttpStatus.NOT_FOUND, "Hero not found: x");
        assertError(handler.handleApiException(new ConflictException("taken"), request),
                HttpStatus.CONFLICT, "taken");
        assertError(handler.handleApiException(new InvalidCredentialsException(), request),
                HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }

    @Test
    void unavailableDatabaseIs503WithRetryAfter() {
        ResponseEntity<ApiError> response = handler.handleDatabaseUnavailable(
                new CannotGetJdbcConnectionException("down"), request);

        assertError(response, HttpStatus.SERVICE_UNAVAILABLE, "The service is temporarily unavailable");
        assertThat(response.getHeaders().getFirst(HttpHeaders.RETRY_AFTER)).isEqualTo("5");
    }

    @Test
    void closedClientConnectionsProduceNoResponseBody() {
        assertThat(handler.handleClientAbort(new ClientAbortException("Broken pipe"), request)).isNull();
    }

    @Test
    void uploadTooLargeIs413() {
        assertError(handler.handleUploadTooLarge(new MaxUploadSizeExceededException(1), request),
                HttpStatus.PAYLOAD_TOO_LARGE, "The uploaded file is too large");
    }

    @Test
    void dataIntegrityViolationIsAConflictWithoutDatabaseDetails() {
        DataIntegrityViolationException exception = new DataIntegrityViolationException("duplicate key value",
                new SQLException("constraint uq_x", "23505"));

        ResponseEntity<ApiError> response = handler.handleDataIntegrity(exception, request);

        assertError(response, HttpStatus.CONFLICT, "Request conflicts with existing data");
    }

    @Test
    void otherDataIntegrityViolationsAreServerErrors() {
        DataIntegrityViolationException exception = new DataIntegrityViolationException("value too long",
                new SQLException("value too long", "22001"));

        ResponseEntity<ApiError> response = handler.handleDataIntegrity(exception, request);

        assertError(response, HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
    }

    @Test
    void unknownResourceIs404() {
        assertError(handler.handleNoResource(new NoResourceFoundException(HttpMethod.GET, "/missing", "missing"),
                request), HttpStatus.NOT_FOUND, "Resource not found");
    }

    @Test
    void typeMismatchNamesTheParameterButDoesNotEchoTheValue() {
        MethodArgumentTypeMismatchException exception = new MethodArgumentTypeMismatchException("<script>",
                Integer.class, "page", null, null);

        ResponseEntity<ApiError> response = handler.handleTypeMismatch(exception, request);

        assertError(response, HttpStatus.BAD_REQUEST, "Invalid request parameter");
        assertThat(response.getBody().subErrors()).singleElement().satisfies(subError -> {
            assertThat(subError.field()).isEqualTo("page");
            assertThat(subError.message()).isEqualTo("Invalid value");
        });
    }

    @Test
    void missingParameterNamesTheParameter() {
        ResponseEntity<ApiError> response = handler.handleMissingParameter(
                new MissingServletRequestParameterException("hero", "String"), request);

        assertError(response, HttpStatus.BAD_REQUEST, "Missing request parameter");
        assertThat(response.getBody().subErrors()).singleElement()
                .satisfies(subError -> assertThat(subError.field()).isEqualTo("hero"));
    }

    @Test
    void constraintViolationsListEveryField() {
        ConstraintViolation<?> violation = mock(ConstraintViolation.class);
        Path path = mock(Path.class);
        when(path.toString()).thenReturn("size");
        when(violation.getPropertyPath()).thenReturn(path);
        when(violation.getMessage()).thenReturn("must be positive");

        ResponseEntity<ApiError> response = handler.handleConstraintViolation(
                new ConstraintViolationException(Set.of(violation)), request);

        assertError(response, HttpStatus.BAD_REQUEST, "Validation failed");
        assertThat(response.getBody().subErrors()).singleElement().satisfies(subError -> {
            assertThat(subError.field()).isEqualTo("size");
            assertThat(subError.message()).isEqualTo("must be positive");
        });
    }

    @Test
    void malformedBodyIs400() {
        assertError(handler.handleUnreadableBody(
                new HttpMessageNotReadableException("bad json", new MockHttpInputMessage(new byte[0])), request),
                HttpStatus.BAD_REQUEST, "Malformed request body");
    }

    @Test
    void protocolErrorsKeepTheirStatus() {
        assertError(handler.handleMethodNotAllowed(new HttpRequestMethodNotSupportedException("PATCH"), request),
                HttpStatus.METHOD_NOT_ALLOWED, "Method not allowed");
        assertError(handler.handleUnsupportedMediaType(new HttpMediaTypeNotSupportedException("bad"), request),
                HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Unsupported content type");
        assertError(handler.handleNotAcceptable(new HttpMediaTypeNotAcceptableException("bad"), request),
                HttpStatus.NOT_ACCEPTABLE, "Not acceptable");
        assertError(handler.handleMissingPart(new MissingServletRequestPartException("file"), request),
                HttpStatus.BAD_REQUEST, "Missing request part: file");
    }

    @Test
    void genericErrorResponsesKeepTheirStatusWithoutDetails() {
        assertError(handler.handleErrorResponse(new ErrorResponseException(HttpStatus.GONE), request),
                HttpStatus.GONE, "Request failed");
    }

    @Test
    void unexpectedErrorsHideTheCause() {
        ResponseEntity<ApiError> response = handler.handleUnexpected(new IllegalStateException("secret"), request);

        assertError(response, HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");
        assertThat(response.getHeaders().containsHeader(HttpHeaders.SET_COOKIE)).isFalse();
    }
}
