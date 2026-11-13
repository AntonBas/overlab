package gg.overlab.backend.seo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import gg.overlab.backend.gamemap.MapMode;
import gg.overlab.backend.gamemap.MapService;
import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.hero.HeroService;
import gg.overlab.backend.hero.ability.AbilityControl;
import gg.overlab.backend.hero.ability.AbilityService;
import gg.overlab.backend.hero.ability.dto.AbilityDto;
import gg.overlab.backend.hero.dto.HeroDto;
import gg.overlab.backend.hero.perk.PerkPosition;
import gg.overlab.backend.hero.perk.PerkRecommendation;
import gg.overlab.backend.hero.perk.PerkService;
import gg.overlab.backend.hero.perk.PerkSlot;
import gg.overlab.backend.hero.perk.dto.PerkDto;
import gg.overlab.backend.hero.relation.HeroRelationService;
import gg.overlab.backend.hero.relation.dto.HeroCountersDto;
import gg.overlab.backend.hero.relation.dto.RelatedHeroDto;
import java.util.List;
import org.junit.jupiter.api.Test;

class SeoContentBuilderTest {

    private final HeroService heroService = mock(HeroService.class);
    private final MapService mapService = mock(MapService.class);
    private final AbilityService abilityService = mock(AbilityService.class);
    private final PerkService perkService = mock(PerkService.class);
    private final HeroRelationService relationService = mock(HeroRelationService.class);
    private final SeoContentBuilder builder =
            new SeoContentBuilder(heroService, mapService, abilityService, perkService, relationService);

    private HeroDto hero() {
        return new HeroDto("ana", "Ana", HeroRole.SUPPORT, "tactician", "d",
                "- Heals from range\n- Strong against [[hero/doomfist]]", "Low mobility", null, false);
    }

    @Test
    void listsHeroesWithRolesAndLinks() {
        when(heroService.findAll()).thenReturn(List.of(hero()));

        SeoSection section = builder.heroList().getFirst();

        assertThat(section.heading()).isEqualTo("Heroes");
        assertThat(section.items()).containsExactly(SeoItem.link("Ana (support)", "/heroes/ana"));
    }

    @Test
    void listsMapsWithModes() {
        when(mapService.findAll()).thenReturn(List.of(new MapDto("busan", "Busan", MapMode.CONTROL, null),
                new MapDto("x", "Unknown mode", null, null)));

        assertThat(builder.mapList().getFirst().items()).containsExactly(
                SeoItem.link("Busan (Control)", "/maps/busan"), SeoItem.link("Unknown mode", "/maps/x"));
    }

    @Test
    void buildsHeroSectionsFromAbilitiesPerksAndRelationsSkippingEmptyOnes() {
        when(abilityService.findByHero("ana")).thenReturn(List.of(new AbilityDto("ana", "sleep-dart", "Sleep Dart",
                "Puts an [[hero/reinhardt]] to sleep", null, AbilityControl.SECONDARY_FIRE, false)));
        when(perkService.findByHero("ana")).thenReturn(List.of(new PerkDto(1L, "ana", "Sharp Eye", "Better aim",
                PerkSlot.MINOR, PerkPosition.LEFT, PerkRecommendation.RECOMMENDED, "Take it on ranged maps", null,
                false)));
        when(relationService.getCounters("ana")).thenReturn(new HeroCountersDto(
                List.of(new RelatedHeroDto("doomfist", "Doomfist", HeroRole.DAMAGE, "Stuns him", null)), List.of()));
        when(relationService.getSynergies("ana")).thenReturn(List.of());

        List<SeoSection> sections = builder.heroDetails(hero());

        assertThat(sections).extracting(SeoSection::heading).containsExactly("Strengths", "Weaknesses", "Abilities",
                "Best Ana perks", "Heroes Ana is strong against");
        assertThat(sections.get(0).items()).extracting(SeoItem::text)
                .containsExactly("Heals from range", "Strong against doomfist");
        assertThat(sections.get(2).items().getFirst().text()).isEqualTo("Sleep Dart: Puts an reinhardt to sleep");
        assertThat(sections.get(3).items().getFirst().text())
                .isEqualTo("Minor perk: Sharp Eye (Recommended): Better aim Take it on ranged maps");
        assertThat(sections.get(4).items().getFirst())
                .isEqualTo(SeoItem.link("Doomfist: Stuns him", "/heroes/doomfist"));
    }

    @Test
    void readableTextDropsLinkMarkupAndCollapsesWhitespace() {
        assertThat(SeoContentBuilder.readable("  a   [[ability/sleep-dart]]\n b ")).isEqualTo("a sleep dart b");
        assertThat(SeoContentBuilder.readable(null)).isEmpty();
    }
}
