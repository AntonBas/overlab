package gg.overlab.backend.exception.core;

import org.springframework.http.HttpStatus;

public class EntityNotFoundException extends ApiException {

    public EntityNotFoundException(String entityName, Object identifier) {
        super(HttpStatus.NOT_FOUND, entityName + " not found: " + identifier);
    }
}
