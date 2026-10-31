package gg.overlab.backend.hero;

import gg.overlab.backend.hero.dto.HeroAdminDto;
import gg.overlab.backend.hero.dto.HeroDto;
import gg.overlab.backend.media.MediaUrlResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class HeroMapper {

    private final MediaUrlResolver mediaUrlResolver;

    public HeroDto toDto(Hero hero) {
        return new HeroDto(
                hero.getSlug(),
                hero.getName(),
                hero.getRole(),
                hero.getSubrole(),
                hero.getDescription(),
                hero.getStrengths(),
                hero.getWeaknesses(),
                mediaUrlResolver.resolve(hero.getPortraitUrl()));
    }

    public HeroAdminDto toAdminDto(Hero hero) {
        return new HeroAdminDto(
                hero.getSlug(),
                hero.getName(),
                hero.getRole(),
                hero.getSubrole(),
                hero.getDescription(),
                hero.getStrengths(),
                hero.getWeaknesses(),
                mediaUrlResolver.resolve(hero.getPortraitUrl()),
                hero.isActive());
    }
}
