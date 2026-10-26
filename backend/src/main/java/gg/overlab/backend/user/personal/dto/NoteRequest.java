package gg.overlab.backend.user.personal.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record NoteRequest(@NotNull @Size(max = 2000) String content) {
}
