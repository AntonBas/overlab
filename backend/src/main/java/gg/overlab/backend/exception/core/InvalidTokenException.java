package gg.overlab.backend.exception.core;

import org.springframework.http.HttpStatus;

public class InvalidTokenException extends ApiException {

    public InvalidTokenException() {
        super(HttpStatus.BAD_REQUEST, "Token is invalid or has expired");
    }
}
