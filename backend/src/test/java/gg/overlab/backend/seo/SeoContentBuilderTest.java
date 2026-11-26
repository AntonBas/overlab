package gg.overlab.backend.seo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import gg.overlab.backend.patch.PatchService;
import gg.overlab.backend.patch.dto.PatchDto;
import gg.overlab.backend.stats.StatsHistoryService;
import gg.overlab.backend.stats.StatsService;
import gg.overlab.backend.stats.dto.HeroChangeDto;
import gg.overlab.backend.stats.dto.StatsComparisonDto;
import gg.overlab.backend.stats.dto.HeroStatDto;
import gg.overlab.backend.stats.dto.StatsSnapshotDto;
import java.math.BigDecimal;
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
    private final StatsHistoryService historyService = mock(StatsHistoryService.class);
    private final PatchService patchService = mock(PatchService.class);
    private final SeoContentBuilder builder =
            new SeoContentBuilder(heroService, mapService, abilityService, perkService, relationService,
                    new SeoStatsContent(statsService, historyService, patchService), guideService);

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
        stubNoStatistics();

        List<SeoSection> sections = builder.heroDetails(hero());

        assertThat(sections).extracting(SeoSection::heading).containsExactly("Strengths", "Weaknesses", "Abilities",
                "Ana perks", "Ana counters and synergies");
        assertThat(sections.get(0).items()).extracting(SeoItem::text)
                .containsExactly("Heals from range", "Strong against doomfist");
        assertThat(sections.get(2).items().getFirst().text()).isEqualTo("Sleep Dart: Puts an reinhardt to sleep");
        assertThat(sections.get(3).items()).containsExactly(
                SeoItem.plain("Ana has 1 perks: 1 Minor and 0 Major. Recommended: Sharp Eye."),
                SeoItem.link("All Ana perks with descriptions", "/heroes/ana/perks"));
        assertThat(sections.get(4).items()).containsExactly(SeoItem.plain("Strong against: Doomfist"),
                SeoItem.link("All Ana counters and synergies with explanations", "/heroes/ana/counters"));
    }

    private HeroStatDto stat(String slug, String name, String win, String pick, String ban, String delta) {
        return new HeroStatDto(slug, name, HeroRole.SUPPORT, null, new BigDecimal(win), new BigDecimal(pick),
                ban == null ? null : new BigDecimal(ban), delta == null ? null : new BigDecimal(delta), null, null,
                null, false);
    }

    private void stubNoMapStatistics() {
        when(statsService.getHeroByMaps(any(), any(), any(), any(), any()))
                .thenThrow(new EntityNotFoundException("Statistics", "x"));
    }

    private void stubStatistics(HeroStatDto... heroes) {
        when(statsService.getStats(any(), any(), any(), eq(true))).thenReturn(new StatsSnapshotDto(Instant.now(),
                GameQueue.COMPETITIVE, RankTier.ALL, "all-maps", Platform.PC, Region.EUROPE, List.of(heroes)));
    }

    private void stubNoStatistics() {
        stubNoMapStatistics();
        when(statsService.getStats(any(), any(), any(), eq(true)))
                .thenThrow(new EntityNotFoundException("Statistics", "x"));
    }

    @Test
    void addsCompetitiveRatesToTheHeroPage() {
        stubStatistics(stat("ana", "Ana", "46.5", "32.4", "11.9", null));
        stubNoMapStatistics();
        when(relationService.getCounters("ana")).thenReturn(new HeroCountersDto(List.of(), List.of()));
        when(relationService.getSynergies("ana")).thenReturn(List.of());

        SeoSection section = builder.heroDetails(hero()).getFirst();

        assertThat(section.heading()).isEqualTo("Ana statistics");
        assertThat(section.items().getFirst().text()).isEqualTo(
                "Ana in Competitive, all ranks, PC, Europe: 46.5% win rate, 32.4% pick rate, 11.9% ban rate.");
    }

    @Test
    void listsLeadersAndEveryHeroOnTheStatsPage() {
        stubStatistics(stat("ana", "Ana", "46.5", "32.4", "11.9", null),
                stat("genji", "Genji", "54.0", "19.5", "13.7", null),
                stat("venture", "Venture", "60.0", "1.0", "0.5", null));

        List<SeoSection> sections = builder.statsOverview();

        assertThat(sections).extracting(SeoSection::heading).contains("About these numbers", "Most picked heroes", "Most banned heroes");
        assertThat(sections).extracting(SeoSection::heading).anyMatch(heading -> heading.startsWith("Highest win rate"));
        assertThat(sections).extracting(SeoSection::heading).contains(
                "Most picked heroes");
        SeoSection highest = sections.stream().filter(section -> section.heading().startsWith("Highest win rate (")).findFirst()
                .orElseThrow();
        assertThat(highest.items().getFirst().path()).isEqualTo("/heroes/genji");
        assertThat(sections.getLast().items()).hasSize(3);
    }

    @Test
    void fallsBackToTheHeroListOnTheStatsPageWithoutStatistics() {
        when(heroService.findAll()).thenReturn(List.of(hero()));
        stubNoStatistics();

        assertThat(builder.statsOverview().getLast().items())
                .containsExactly(SeoItem.link("Ana win, pick and ban rates", "/heroes/ana"));
    }

    @Test
    void ranksHeroesOnAMapAndSkipsRarelyPickedOnes() {
        stubStatistics(stat("ana", "Ana", "48.3", "33.1", "11.3", "1.8"),
                stat("genji", "Genji", "55.6", "18.6", "14.0", "1.6"),
                stat("venture", "Venture", "70.0", "1.0", "0.5", "9.0"));

        List<SeoSection> sections = builder.mapDetails(new MapDto("route-66", "Route 66", MapMode.ESCORT, null));

        assertThat(sections).extracting(SeoSection::heading).containsExactly("Game mode",
                "Biggest win rate gain on Route 66", "Highest win rate on Route 66", "Weakest picks on Route 66",
                "More statistics");
        assertThat(sections.get(1).items()).extracting(SeoItem::path).containsExactly("/heroes/ana", "/heroes/genji");
        assertThat(sections.get(2).items().getFirst().text())
                .isEqualTo("Genji: 55.6% win rate (+1.6 compared with the hero's average), 18.6% pick rate");
    }

    @Test
    void keepsOnlyTheGameModeOnAMapWithoutStatistics() {
        stubNoStatistics();

        assertThat(builder.mapDetails(new MapDto("x", "X", MapMode.PUSH, null))).extracting(SeoSection::heading)
                .containsExactly("Game mode");
        assertThat(builder.mapDetails(new MapDto("x", "X", null, null))).isEmpty();
    }

    @Test
    void listsTheBiggestWinRateMovesAfterTheLatestPatch() {
        PatchDto patch = new PatchDto(1L, "7.1", "7-1", "Season 7", 7, Instant.now(), null);
        when(patchService.findAll()).thenReturn(List.of(patch));
        HeroChangeDto up = change("genji", "Genji", "50.0", "53.0", "3.0", "10.0");
        HeroChangeDto down = change("ana", "Ana", "50.0", "47.0", "-3.0", "10.0");
        HeroChangeDto rare = change("venture", "Venture", "40.0", "60.0", "20.0", "1.0");
        when(historyService.compareAroundPatch(any(), eq("7-1"))).thenReturn(new StatsComparisonDto(Instant.now(),
                Instant.now(), GameQueue.COMPETITIVE, RankTier.ALL, "all-maps", Platform.PC, Region.EUROPE,
                List.of(up, down, rare)));
        when(heroService.findAll()).thenReturn(List.of(hero()));

        List<SeoSection> sections = builder.changesOverview();

        assertThat(sections).extracting(SeoSection::heading).contains("Biggest win rate gains after Season 7",
                "Biggest win rate drops after Season 7");
        assertThat(sections.get(1).items()).extracting(SeoItem::text)
                .containsExactly("Genji: 50.0% to 53.0% win rate (+3.0)");
        assertThat(sections.get(2).items()).extracting(SeoItem::text)
                .containsExactly("Ana: 50.0% to 47.0% win rate (-3.0)");
    }

    @Test
    void keepsTheChangesPageStaticWithoutPatchesOrSnapshots() {
        when(heroService.findAll()).thenReturn(List.of(hero()));
        when(patchService.findAll()).thenReturn(List.of());

        assertThat(builder.changesOverview()).extracting(SeoSection::heading).containsExactly("What changed", "Heroes");

        when(patchService.findAll()).thenReturn(List.of(new PatchDto(1L, "7.1", "7-1", null, 7, Instant.now(), null)));
        when(historyService.compareAroundPatch(any(), eq("7-1")))
                .thenThrow(new EntityNotFoundException("Statistics snapshot", "x"));

        assertThat(builder.changesOverview()).extracting(SeoSection::heading).containsExactly("What changed", "Heroes");
    }

    @Test
    void summarisesPerksAndCountersAtTheTopOfTheirPages() {
        when(perkService.findByHero("ana")).thenReturn(List.of(
                new PerkDto(1L, "ana", "Sharp Eye", "Better aim", PerkSlot.MINOR, PerkPosition.LEFT,
                        PerkRecommendation.RECOMMENDED, null, null, false),
                new PerkDto(2L, "ana", "Big Dart", "More damage", PerkSlot.MAJOR, PerkPosition.LEFT,
                        PerkRecommendation.OPTIONAL, null, null, false)));
        when(relationService.getCounters("ana")).thenReturn(new HeroCountersDto(
                List.of(new RelatedHeroDto("doomfist", "Doomfist", HeroRole.DAMAGE, null, null)), List.of()));
        when(relationService.getSynergies("ana")).thenReturn(List.of());

        assertThat(builder.heroPerks(hero()).getFirst().items().getFirst().text())
                .isEqualTo("Ana has 2 perks: 1 Minor and 1 Major. Recommended: Sharp Eye.");
        assertThat(builder.heroCounters(hero()).getFirst().items().getFirst().text())
                .isEqualTo("Ana counters and synergies, curated by Overlab: Heroes Ana is strong against (1).");
    }

    private HeroChangeDto change(String slug, String name, String before, String after, String change,
                                 String pickAfter) {
        return new HeroChangeDto(slug, name, HeroRole.SUPPORT, new BigDecimal(before), new BigDecimal(after),
                new BigDecimal(change), null, new BigDecimal(pickAfter), null, null, null, null, null, null);
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
