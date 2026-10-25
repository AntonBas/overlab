package gg.overlab.backend.hero;

import gg.overlab.backend.hero.dto.HeroDto;
import org.springframework.stereotype.Component;

@Component
public class HeroMapper {

    public HeroDto toDto(Hero hero) {
        return new HeroDto(
                hero.getSlug(),
                hero.getName(),
                hero.getRole(),
                hero.getSubrole(),
                hero.getDescription(),
                hero.getPortraitUrl());
    }
}
