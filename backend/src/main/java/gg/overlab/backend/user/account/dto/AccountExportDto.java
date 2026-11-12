package gg.overlab.backend.user.account.dto;

import gg.overlab.backend.config.security.UserRole;
import gg.overlab.backend.feedback.dto.FeedbackDto;
import gg.overlab.backend.hero.relation.feedback.dto.RelationVoteDto;
import gg.overlab.backend.user.AuthProvider;
import gg.overlab.backend.user.personal.dto.FavoritesDto;
import gg.overlab.backend.user.personal.dto.PreferencesDto;
import java.time.Instant;
import java.util.List;

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
        List<RelationVoteDto> relationVotes,
        List<FeedbackDto> feedback,
        PreferencesDto preferences) {
}
