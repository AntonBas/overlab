package gg.overlab.backend.stats.dto;

import gg.overlab.backend.hero.HeroRole;
import io.swagger.v3.oas.annotations.media.Schema;
import java.io.Serializable;
import java.time.Instant;

public record HeroRoleChangeDto(
        @Schema(description = "When the collector noticed the new role") Instant changedAt,
        @Schema(description = "Role before the change") HeroRole previousRole,
        @Schema(description = "Role after the change") HeroRole newRole) implements Serializable {
}
