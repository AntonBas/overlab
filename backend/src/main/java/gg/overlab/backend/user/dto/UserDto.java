package gg.overlab.backend.user.dto;

import gg.overlab.backend.config.security.UserRole;
import gg.overlab.backend.user.AuthProvider;

public record UserDto(
        Long id,
        String email,
        String displayName,
        UserRole role,
        AuthProvider provider,
        boolean emailVerified) {
}
