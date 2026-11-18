package gg.overlab.backend.seo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import gg.overlab.backend.gamemap.MapMode;
import gg.overlab.backend.gamemap.MapService;
import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.guide.GuideService;
import gg.overlab.backend.guide.dto.GuideDto;
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
import gg.overlab.backend.stats.StatsService;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

class SeoContentBuilderTest {

    private final HeroService heroService = mock(HeroService.class);
    private final MapService mapService = mock(MapService.class);
    private final AbilityService abilityService = mock(AbilityService.class);
    private final PerkService perkService = mock(PerkService.class);
    private final HeroRelationService relationService = mock(HeroRelationService.class);
    private final StatsService statsService = mock(StatsService.class);
    private final GuideService guideService = mock(GuideService.class);
    private final SeoContentBuilder builder =
            new SeoContentBuilder(heroService, mapService, abilityService, perkService, relationService,
                    statsService, guideService);

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
        when(abilityService.findByHero("ana")).thenReturn(List.of(new AbilityDto("ana", "Ana", null, "sleep-dart", "Sleep Dart",
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

    private GuideDto guide(String path, String title, String heroName, String mapName) {
        return new GuideDto(1L, path, path, "ana", heroName, "busan", mapName, title, "abc123", 0, null, null, null,
                null, null, null, 0, true, null);
    }

    @Test
    void listsHeroGuidesWithTheirMapAndALinkBackToTheHero() {
        when(guideService.findPublished("ana", null)).thenReturn(List.of(guide("1-sleep", "Sleep dart", "Ana", "Busan"),
                guide("2-nade", "Nade", "Ana", "Nepal")));

        List<SeoSection> sections = builder.heroGuides(hero());

        assertThat(sections.getFirst().heading()).isEqualTo("Ana video guides");
        assertThat(sections.getFirst().items().getFirst().text()).isEqualTo("Sleep dart (Busan)");
        assertThat(sections.getFirst().items().getFirst().path()).isEqualTo("/guides/1-sleep");
        assertThat(sections.getLast().items().getFirst().path()).isEqualTo("/heroes/ana");
    }

    @Test
    void listsMapGuidesWithTheirHeroAndHasNoSectionsWithoutGuides() {
        MapDto map = new MapDto("busan", "Busan", null, null);
        when(guideService.findPublished(null, "busan")).thenReturn(List.of(guide("1-sleep", "Sleep dart", "Ana", "Busan"),
                guide("2-nade", "Nade", "Ana", "Busan")));

        assertThat(builder.mapGuides(map).getFirst().items().getFirst().text()).isEqualTo("Sleep dart (Ana)");
        assertThat(builder.mapGuides(new MapDto("nepal", "Nepal", null, null))).isEmpty();
    }

    @Test
    void buildsTheGuideHubWithLatestGuidesAndCountsPerHeroAndMap() {
        GuideDto first = new GuideDto(1L, "a", "1-a", "ana", "Ana", "busan", "Busan", "Sleep dart", "x", 0, null, null,
                null, null, null, null, 0, true, Instant.parse("2026-11-01T10:00:00Z"));
        GuideDto second = new GuideDto(2L, "b", "2-b", "ana", "Ana", null, null, "Tips", "y", 0, null, null, null,
                null, null, null, 0, true, Instant.parse("2026-11-05T10:00:00Z"));
        when(guideService.findPublished(null, null)).thenReturn(List.of(first, second));

        List<SeoSection> sections = builder.guideHub();

        assertThat(sections).extracting(SeoSection::heading)
                .containsExactly("Latest guides", "Guides by hero", "Guides by map");
        assertThat(sections.getFirst().items().getFirst().path()).isEqualTo("/guides/2-b");
        assertThat(sections.get(1).items().getFirst().text()).isEqualTo("Ana guides (2)");
        assertThat(sections.get(1).items().getFirst().path()).isEqualTo("/heroes/ana/guides");
        assertThat(sections.get(2).items()).hasSize(1);
        assertThat(sections.get(2).items().getFirst().path()).isEqualTo("/guides/1-a");
    }

    @Test
    void hasNoGuideListForAHeroOrMapWithASingleGuide() {
        when(guideService.findPublished("ana", null)).thenReturn(List.of(guide("1-sleep", "Sleep dart", "Ana", "Busan")));
        when(guideService.findPublished(null, "busan")).thenReturn(List.of(guide("1-sleep", "Sleep dart", "Ana", "Busan")));

        assertThat(builder.heroGuides(hero())).isEmpty();
        assertThat(builder.mapGuides(new MapDto("busan", "Busan", null, null))).isEmpty();
    }

    @Test
    void linksTheGuideHubStraightToTheVideoWhenAHeroHasOnlyOne() {
        GuideDto single = new GuideDto(3L, "c", "3-c", "ashe", "Ashe", "busan", "Busan", "Dynamite", "z", 0, null, null,
                null, null, null, null, 0, true, Instant.parse("2026-11-02T10:00:00Z"));
        GuideDto first = new GuideDto(1L, "a", "1-a", "ana", "Ana", null, null, "Sleep dart", "x", 0, null, null,
                null, null, null, null, 0, true, Instant.parse("2026-11-01T10:00:00Z"));
        GuideDto second = new GuideDto(2L, "b", "2-b", "ana", "Ana", null, null, "Tips", "y", 0, null, null, null,
                null, null, null, 0, true, Instant.parse("2026-11-05T10:00:00Z"));
        when(guideService.findPublished(null, null)).thenReturn(List.of(first, second, single));

        SeoSection byHero = builder.guideHub().stream().filter(section -> section.heading().equals("Guides by hero"))
                .findFirst().orElseThrow();

        assertThat(byHero.items()).extracting(SeoItem::path).containsExactly("/heroes/ana/guides", "/guides/3-c");
    }

    @Test
    void hasNoGuideHubWithoutGuides() {
        when(guideService.findPublished(null, null)).thenReturn(List.of());

        assertThat(builder.guideHub()).isEmpty();
    }
}
