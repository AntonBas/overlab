package gg.overlab.backend.hero.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CategoryRequest(
        @NotBlank @Size(max = 64) @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "must contain lowercase letters, digits and dashes") String slug,
        @NotBlank @Size(max = 128) String name,
        @Size(max = 2000) String description,
        @NotNull List<@NotBlank String> heroSlugs) {
}
