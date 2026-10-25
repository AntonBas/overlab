package gg.overlab.backend.guide.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record GuideRequest(
        @NotBlank String heroSlug,
        String mapSlug,
        @NotBlank @Size(max = 256) String title,
        @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "must contain lowercase letters, digits and dashes")
        @Size(max = 200) String slug,
        @NotBlank @Pattern(regexp = "^[A-Za-z0-9_-]{11}$", message = "must be an 11 character YouTube video id")
        String youtubeId,
        @Min(0) Integer startSeconds,
        @Size(max = 2000) String description,
        Integer sortOrder,
        Boolean published) {
}
