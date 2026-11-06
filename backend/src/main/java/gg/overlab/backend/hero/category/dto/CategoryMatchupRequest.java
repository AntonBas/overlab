package gg.overlab.backend.hero.category.dto;

import gg.overlab.backend.hero.category.CategoryMatchupType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CategoryMatchupRequest(
        @NotBlank String heroSlug,
        @NotBlank String categorySlug,
        @NotNull CategoryMatchupType type,
        @Size(max = 2000) String note) {
}
