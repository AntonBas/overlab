package gg.overlab.backend.hero;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.hero.dto.HeroAdminDto;
import gg.overlab.backend.hero.dto.HeroDto;
import gg.overlab.backend.media.MediaProperties;
import gg.overlab.backend.media.MediaUrlResolver;
import java.nio.file.Path;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Test;

class HeroMapperTest {

    private final HeroMapper mapper = new HeroMapper(new MediaUrlResolver(new MediaProperties(Path.of("media"),
            "https://cdn.example/media/")));

    private Hero hero() {
        Hero hero = new Hero();
        hero.setSlug("ana");
        hero.setName("Ana");
        hero.setRole(HeroRole.SUPPORT);
        hero.setSubrole("Main healer");
        hero.setDescription("Heals");
        hero.setStrengths("Range");
        hero.setWeaknesses("Slow");
        hero.setPortraitUrl("heroes/ana.webp");
        return hero;
    }

    @Test
    void publicDtoCarriesTheTextsAndAFullPortraitUrl() {
        HeroDto dto = mapper.toDto(hero());

        assertThat(dto.slug()).isEqualTo("ana");
        assertThat(dto.role()).isEqualTo(HeroRole.SUPPORT);
        assertThat(dto.subrole()).isEqualTo("Main healer");
        assertThat(dto.strengths()).isEqualTo("Range");
        assertThat(dto.weaknesses()).isEqualTo("Slow");
        assertThat(dto.portraitUrl()).isEqualTo("https://cdn.example/media/heroes/ana.webp");
        assertThat(dto.recentlyAdded()).isFalse();
    }

    @Test
    void aRecentlyIntroducedHeroIsMarkedNew() {
        Hero hero = hero();
        hero.setIntroducedAt(Instant.now().minus(2, ChronoUnit.DAYS));

        assertThat(mapper.toDto(hero).recentlyAdded()).isTrue();
    }

    @Test
    void adminDtoExposesTheActiveFlag() {
        Hero hero = hero();
        hero.setActive(false);

        HeroAdminDto dto = mapper.toAdminDto(hero);

        assertThat(dto.active()).isFalse();
        assertThat(dto.portraitUrl()).isEqualTo("https://cdn.example/media/heroes/ana.webp");
    }

    @Test
    void aMissingPortraitStaysEmpty() {
        Hero hero = hero();
        hero.setPortraitUrl(null);

        assertThat(mapper.toDto(hero).portraitUrl()).isNull();
    }
}
