package gg.overlab.backend.config.security;

public interface TokenSubject {

    Long getId();

    String getEmail();

    UserRole getRole();
}
