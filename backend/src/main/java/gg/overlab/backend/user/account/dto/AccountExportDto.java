package gg.overlab.backend.user.account.dto;

import gg.overlab.backend.user.AuthProvider;
import gg.overlab.backend.user.UserRole;
import gg.overlab.backend.user.personal.dto.FavoritesDto;
import gg.overlab.backend.user.personal.dto.NoteDto;
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
        List<NoteDto> notes,
        PreferencesDto preferences) {
}
