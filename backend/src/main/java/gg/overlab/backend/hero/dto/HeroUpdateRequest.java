package gg.overlab.backend.hero.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record HeroUpdateRequest(
        @Size(max = 5000) String description,
        @Size(max = 5000) String strengths,
        @Size(max = 5000) String weaknesses,
        @NotNull Boolean active) {
}
