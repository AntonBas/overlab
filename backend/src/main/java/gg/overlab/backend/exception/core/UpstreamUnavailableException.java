package gg.overlab.backend.exception.core;

import org.springframework.http.HttpStatus;

public class UpstreamUnavailableException extends ApiException {

    public UpstreamUnavailableException(String message) {
        super(HttpStatus.BAD_GATEWAY, message);
    }
}
