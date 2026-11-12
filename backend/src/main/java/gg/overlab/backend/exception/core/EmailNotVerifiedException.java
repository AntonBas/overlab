package gg.overlab.backend.exception.core;

public class EmailNotVerifiedException extends RuntimeException {

    public EmailNotVerifiedException() {
        super("Email is not verified");
    }
}
