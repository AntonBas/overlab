package gg.overlab.backend.user.account.dto;

import gg.overlab.backend.user.AuthProvider;
import gg.overlab.backend.user.UserRole;
import java.time.Instant;

public record AccountExportDto(
        Long id,
        String email,
        String displayName,
        UserRole role,
        AuthProvider provider,
        boolean emailVerified,
        Instant createdAt,
        Instant lastLoginAt) {
}
