package gg.overlab.backend.exception.core;

public class EntityNotFoundException extends RuntimeException {

    public EntityNotFoundException(String entityName, Object identifier) {
        super(entityName + " not found: " + identifier);
    }
}
