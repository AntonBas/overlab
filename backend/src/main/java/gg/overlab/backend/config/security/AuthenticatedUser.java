package gg.overlab.backend.config.security;


public record AuthenticatedUser(Long id, String email, UserRole role) {
}
