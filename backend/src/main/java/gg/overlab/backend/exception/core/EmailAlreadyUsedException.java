package gg.overlab.backend.exception.core;

import org.springframework.http.HttpStatus;

public class EmailAlreadyUsedException extends ApiException {

    public EmailAlreadyUsedException() {
        super(HttpStatus.CONFLICT, "Email is already registered");
    }
}
