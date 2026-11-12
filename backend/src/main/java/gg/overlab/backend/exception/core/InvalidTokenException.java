package gg.overlab.backend.exception.core;

public class InvalidTokenException extends RuntimeException {

    public InvalidTokenException() {
        super("Token is invalid or has expired");
    }
}
