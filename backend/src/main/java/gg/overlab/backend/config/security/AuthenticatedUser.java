package gg.overlab.backend.config.security;

import gg.overlab.backend.user.UserRole;

public record AuthenticatedUser(Long id, String email, UserRole role) {
}
