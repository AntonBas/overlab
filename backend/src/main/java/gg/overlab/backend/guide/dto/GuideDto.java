package gg.overlab.backend.guide.dto;

import java.io.Serializable;

public record GuideDto(
        Long id,
        String slug,
        String path,
        String heroSlug,
        String heroName,
        String mapSlug,
        String mapName,
        String title,
        String youtubeId,
        int startSeconds,
        String embedUrl,
        String description,
        int sortOrder,
        boolean published) implements Serializable {
}
