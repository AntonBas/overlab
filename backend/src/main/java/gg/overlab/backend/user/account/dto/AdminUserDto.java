package gg.overlab.backend.user.account.dto;

import gg.overlab.backend.user.AuthProvider;
import gg.overlab.backend.user.UserRole;
import java.time.Instant;

public record AdminUserDto(
        Long id,
        String email,
        String displayName,
        UserRole role,
        AuthProvider provider,
        boolean emailVerified,
        boolean enabled,
        Instant createdAt,
        Instant lastLoginAt) {
}
