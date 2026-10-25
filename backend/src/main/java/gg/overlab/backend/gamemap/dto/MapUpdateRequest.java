package gg.overlab.backend.gamemap.dto;

import gg.overlab.backend.gamemap.MapMode;
import jakarta.validation.constraints.Size;

public record MapUpdateRequest(MapMode mode, @Size(max = 512) String imageUrl) {
}
