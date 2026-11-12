package gg.overlab.backend.gamemap.dto;

import gg.overlab.backend.gamemap.MapMode;
import jakarta.validation.constraints.NotNull;

public record MapUpdateRequest(@NotNull MapMode mode) {
}
