package gg.overlab.backend.hero.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record HeroUpdateRequest(@Size(max = 5000) String description, @NotNull Boolean active) {
}
