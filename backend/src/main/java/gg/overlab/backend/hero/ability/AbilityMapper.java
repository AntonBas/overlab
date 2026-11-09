package gg.overlab.backend.hero.ability;

import gg.overlab.backend.common.NewBadge;
import gg.overlab.backend.hero.ability.dto.AbilityAdminDto;
import gg.overlab.backend.hero.ability.dto.AbilityDto;
import gg.overlab.backend.media.MediaUrlResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AbilityMapper {

    private final MediaUrlResolver mediaUrlResolver;

    public AbilityDto toDto(HeroAbility ability) {
        return new AbilityDto(
                ability.getHero().getSlug(),
                ability.getSlug(),
                ability.getName(),
                ability.getDescription(),
                mediaUrlResolver.resolve(ability.getIconUrl()),
                ability.getControl(),
                NewBadge.isRecent(ability.getIntroducedAt()));
    }

    public AbilityAdminDto toAdminDto(HeroAbility ability) {
        return new AbilityAdminDto(
                ability.getId(),
                ability.getHero().getSlug(),
                ability.getName(),
                mediaUrlResolver.resolve(ability.getIconUrl()),
                ability.getControl());
    }
}
