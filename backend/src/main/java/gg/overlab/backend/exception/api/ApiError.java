package gg.overlab.backend.exception.api;

import java.time.Instant;
import java.util.List;

public record ApiError(
        String status,
        int statusCode,
        Instant timestamp,
        String message,
        String path,
        List<SubError> subErrors) {

    public record SubError(String field, String message) {
    }
}
