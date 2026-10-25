package gg.overlab.backend.user.dto;

import gg.overlab.backend.user.AuthProvider;
import gg.overlab.backend.user.UserRole;

public record UserDto(
        Long id,
        String email,
        String displayName,
        UserRole role,
        AuthProvider provider,
        boolean emailVerified) {
}
