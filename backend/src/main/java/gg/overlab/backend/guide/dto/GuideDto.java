package gg.overlab.backend.guide.dto;

import gg.overlab.backend.guide.GuideKind;
import gg.overlab.backend.guide.GuideSide;
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
        Integer endSeconds,
        GuideKind kind,
        GuideSide side,
        String abilitySlug,
        String embedUrl,
        String description,
        int sortOrder,
        boolean published) implements Serializable {
}
