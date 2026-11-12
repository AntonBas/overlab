package gg.overlab.backend.exception.core;

import org.springframework.http.HttpStatus;

public class SessionExpiredException extends ApiException {

    public SessionExpiredException() {
        super(HttpStatus.UNAUTHORIZED, "Session has expired");
    }
}
