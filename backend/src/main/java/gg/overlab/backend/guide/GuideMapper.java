package gg.overlab.backend.guide;

import gg.overlab.backend.guide.dto.GuideDto;
import org.springframework.stereotype.Component;

@Component
public class GuideMapper {

    private static final String EMBED_BASE_URL = "https://www.youtube-nocookie.com/embed/";

    public GuideDto toDto(Guide guide) {
        boolean hasMap = guide.getMap() != null;
        return new GuideDto(
                guide.getId(),
                guide.getSlug(),
                guide.getSlug(),
                guide.getHero().getSlug(),
                guide.getHero().getName(),
                hasMap ? guide.getMap().getSlug() : null,
                hasMap ? guide.getMap().getName() : null,
                guide.getTitle(),
                guide.getYoutubeId(),
                guide.getStartSeconds(),
                guide.getEndSeconds(),
                guide.getKind(),
                guide.getSide(),
                guide.getAbilitySlug(),
                embedUrl(guide),
                guide.getDescription(),
                guide.getSortOrder(),
                guide.isPublished(),
                guide.getCreatedAt());
    }

    private String embedUrl(Guide guide) {
        String url = EMBED_BASE_URL + guide.getYoutubeId() + "?start=" + guide.getStartSeconds();
        return guide.getEndSeconds() == null ? url : url + "&end=" + guide.getEndSeconds();
    }
}
