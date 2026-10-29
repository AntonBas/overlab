package gg.overlab.backend.hero.perk;

import gg.overlab.backend.hero.perk.dto.PerkDto;
import gg.overlab.backend.hero.perk.dto.PerkRequest;
import gg.overlab.backend.media.MediaUrlResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PerkMapper {

    private final MediaUrlResolver mediaUrlResolver;

    public PerkDto toDto(Perk perk) {
        return new PerkDto(
                perk.getId(),
                perk.getHero().getSlug(),
                perk.getName(),
                perk.getDescription(),
                perk.getSlot(),
                perk.getPosition(),
                perk.getRecommendation(),
                perk.getRecommendationNote(),
                mediaUrlResolver.resolve(perk.getIconUrl()));
    }

    public void apply(PerkRequest request, Perk perk) {
        perk.setName(request.name().trim());
        perk.setDescription(request.description());
        perk.setSlot(request.slot());
        perk.setPosition(request.position());
        perk.setRecommendation(request.recommendation());
        perk.setRecommendationNote(request.recommendationNote());
    }
}
