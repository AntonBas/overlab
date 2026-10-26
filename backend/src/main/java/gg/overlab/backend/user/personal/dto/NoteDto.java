package gg.overlab.backend.user.personal.dto;

import java.time.Instant;

public record NoteDto(String heroSlug, String heroName, String content, Instant updatedAt) {
}
