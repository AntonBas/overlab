package gg.overlab.backend.user.account.dto;

import gg.overlab.backend.hero.relation.feedback.dto.RelationFeedbackExportDto;
import gg.overlab.backend.user.AuthProvider;
import gg.overlab.backend.user.UserRole;
import gg.overlab.backend.user.personal.dto.FavoritesDto;
import gg.overlab.backend.user.personal.dto.PreferencesDto;
import java.time.Instant;

public record AccountExportDto(
        Long id,
        String email,
        String displayName,
        UserRole role,
        AuthProvider provider,
        boolean emailVerified,
        Instant createdAt,
        Instant lastLoginAt,
        FavoritesDto favorites,
        RelationFeedbackExportDto relationFeedback,
        PreferencesDto preferences) {
}
