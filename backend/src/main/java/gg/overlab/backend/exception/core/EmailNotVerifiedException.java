package gg.overlab.backend.exception.core;

import org.springframework.http.HttpStatus;

public class EmailNotVerifiedException extends ApiException {

    public EmailNotVerifiedException() {
        super(HttpStatus.FORBIDDEN, "Email is not verified");
    }
}
