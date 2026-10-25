package gg.overlab.backend.patch.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record PatchRequest(
        @NotBlank @Size(max = 64) String version,
        @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "must contain lowercase letters, digits and dashes")
        @Size(max = 64) String slug,
        @Size(max = 128) String title,
        @NotNull Instant releasedAt,
        @Size(max = 10000) String notes) {
}
