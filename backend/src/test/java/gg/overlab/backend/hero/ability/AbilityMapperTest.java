package gg.overlab.backend.hero.ability;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.ability.dto.AbilityAdminDto;
import gg.overlab.backend.hero.ability.dto.AbilityDto;
import gg.overlab.backend.media.MediaProperties;
import gg.overlab.backend.media.MediaUrlResolver;
import java.nio.file.Path;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Test;

class AbilityMapperTest {

    private final AbilityMapper mapper = new AbilityMapper(new MediaUrlResolver(new MediaProperties(Path.of("media"),
            "/media")));

    private HeroAbility ability() {
        Hero hero = new Hero();
        hero.setSlug("ana");
        HeroAbility ability = new HeroAbility();
        ability.setHero(hero);
        ability.setSlug("sleep-dart");
        ability.setName("Sleep Dart");
        ability.setDescription("Puts an enemy to sleep");
        ability.setIconUrl("abilities/ability-1.png");
        ability.setControl(AbilityControl.SECONDARY_FIRE);
        return ability;
    }

    @Test
    void publicDtoCarriesTheControlSlotAndAnIconUrl() {
        AbilityDto dto = mapper.toDto(ability());

        assertThat(dto.heroSlug()).isEqualTo("ana");
        assertThat(dto.slug()).isEqualTo("sleep-dart");
        assertThat(dto.control()).isEqualTo(AbilityControl.SECONDARY_FIRE);
        assertThat(dto.iconUrl()).isEqualTo("/media/abilities/ability-1.png");
        assertThat(dto.recentlyAdded()).isFalse();
    }

    @Test
    void aNewAbilityIsMarkedAsRecentlyAdded() {
        HeroAbility ability = ability();
        ability.setIntroducedAt(Instant.now().minus(1, ChronoUnit.DAYS));

        assertThat(mapper.toDto(ability).recentlyAdded()).isTrue();
    }

    @Test
    void adminDtoHasTheIdAndTheControlSlot() {
        HeroAbility ability = ability();

        AbilityAdminDto dto = mapper.toAdminDto(ability);

        assertThat(dto.heroSlug()).isEqualTo("ana");
        assertThat(dto.control()).isEqualTo(AbilityControl.SECONDARY_FIRE);
    }
}
