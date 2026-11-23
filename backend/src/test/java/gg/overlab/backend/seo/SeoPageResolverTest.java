package gg.overlab.backend.seo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.gamemap.MapService;
import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.guide.GuideService;
import gg.overlab.backend.guide.dto.GuideDto;
import gg.overlab.backend.hero.HeroService;
import gg.overlab.backend.hero.dto.HeroDto;
import java.util.List;
import org.junit.jupiter.api.Test;

class SeoPageResolverTest {

    private final HeroService heroService = mock(HeroService.class);
    private final MapService mapService = mock(MapService.class);
    private final GuideService guideService = mock(GuideService.class);
    private final SeoContentBuilder contentBuilder = mock(SeoContentBuilder.class);
    private final SeoPageResolver resolver = new SeoPageResolver(heroService, mapService, guideService,
            new SiteUrl("https://example.com/"), contentBuilder);

    private HeroDto hero(String slug, String name, String description) {
        return new HeroDto(slug, name, null, null, description, null, null, null, false);
    }

    @Test
    void resolvesStaticPagesAndIgnoresTrailingSlash() {
        assertThat(resolver.resolve("/stats/")).hasValueSatisfying(page -> {
            assertThat(page.title()).isEqualTo("Overwatch hero win, pick and ban rates");
            assertThat(page.heading()).isEqualTo("Hero statistics");
            assertThat(page.path()).isEqualTo("/stats");
        });
        assertThat(resolver.resolve("/")).hasValueSatisfying(page -> assertThat(page.title()).isEqualTo("Overlab: Overwatch hero statistics"));
    }

    @Test
    void rejectsUnknownAndServicePaths() {
        assertThat(resolver.resolve("/login")).isEmpty();
        assertThat(resolver.resolve("/admin/users")).isEmpty();
        assertThat(resolver.resolve("/heroes/../etc")).isEmpty();
    }

    @Test
    void buildsHeroPageWithPlainDescriptionAndBreadcrumbs() {
        when(heroService.findAll()).thenReturn(List.of(
                hero("ana", "Ana", "Heals allies and counters [[hero/reinhardt]].")));

        SeoPage page = resolver.resolve("/heroes/ana").orElseThrow();

        assertThat(page.title()).isEqualTo("Ana stats, perks, counters and best maps");
        assertThat(page.heading()).isEqualTo("Ana");
        assertThat(page.description()).startsWith("Ana Overwatch stats: win, pick and ban rates, perks, counters")
                .contains("Heals allies and counters reinhardt.");
        assertThat(page.structuredData().getFirst()).contains("BreadcrumbList", "https://example.com/heroes");
    }

    @Test
    void hidesInactiveHeroesAndUnknownMaps() {
        when(heroService.findAll()).thenReturn(List.of(hero("ana", "Ana", null)));
        when(mapService.getBySlug("nowhere")).thenThrow(new EntityNotFoundException("Map", "nowhere"));

        assertThat(resolver.resolve("/heroes/old")).isEmpty();
        assertThat(resolver.resolve("/maps/nowhere")).isEmpty();
    }

    @Test
    void buildsAHeroPerksPageOnlyForHeroesWithPerks() {
        when(heroService.findAll()).thenReturn(List.of(hero("ana", "Ana", null), hero("zarya", "Zarya", null)));
        when(contentBuilder.heroPerks(hero("ana", "Ana", null))).thenReturn(List.of(
                new SeoSection("Best Ana perks", List.of(SeoItem.plain("Sharp Eye")))));
        when(contentBuilder.heroPerks(hero("zarya", "Zarya", null))).thenReturn(List.of());

        assertThat(resolver.resolve("/heroes/ana/perks")).hasValueSatisfying(page -> {
            assertThat(page.path()).isEqualTo("/heroes/ana/perks");
            assertThat(page.title()).isEqualTo("Ana perks: best Minor and Major perks");
            assertThat(page.heading()).isEqualTo("Ana perks");
            assertThat(page.structuredData().getFirst()).contains("BreadcrumbList", "/heroes/ana/perks");
        });
        assertThat(resolver.resolve("/heroes/zarya/perks")).isEmpty();
        assertThat(resolver.resolve("/heroes/nobody/perks")).isEmpty();
        assertThat(resolver.resolve("/maps/busan/perks")).isEmpty();
    }

    @Test
    void buildsCountersAndMapsPagesWithTheirOwnTitles() {
        HeroDto ana = hero("ana", "Ana", null);
        when(heroService.findAll()).thenReturn(List.of(ana));
        List<SeoSection> content = List.of(new SeoSection("Section", List.of(SeoItem.plain("Item"))));
        when(contentBuilder.heroCounters(ana)).thenReturn(content);
        when(contentBuilder.heroMaps(ana)).thenReturn(content);

        assertThat(resolver.resolve("/heroes/ana/counters")).hasValueSatisfying(page -> {
            assertThat(page.title()).isEqualTo("Ana counters and synergies");
            assertThat(page.path()).isEqualTo("/heroes/ana/counters");
        });
        assertThat(resolver.resolve("/heroes/ana/maps")).hasValueSatisfying(page -> {
            assertThat(page.title()).isEqualTo("Best and worst maps for Ana");
            assertThat(page.heading()).isEqualTo("Ana maps");
        });
    }

    @Test
    void buildsMapPage() {
        when(mapService.getBySlug("busan")).thenReturn(new MapDto("busan", "Busan", null, null));

        assertThat(resolver.resolve("/maps/busan")).hasValueSatisfying(page ->
                assertThat(page.description()).startsWith("Busan Overwatch map: win, pick and ban rates"));
    }

    @Test
    void buildsVideoDataForAPublishedGuideAndHidesUnknownOnes() {
        GuideDto guide = new GuideDto(7L, "sleep-dart", "sleep-dart", "ana", "Ana", null, null, "Sleep dart tips",
                "abc123", 0, null, null, null, null, null, null, 0, true, null);
        when(guideService.getPublishedByPath("sleep-dart")).thenReturn(guide);
        when(guideService.getPublishedByPath("draft")).thenThrow(new EntityNotFoundException("Guide", "draft"));

        SeoPage page = resolver.resolve("/guides/sleep-dart").orElseThrow();

        assertThat(page.openGraphType()).isEqualTo("video.other");
        assertThat(page.structuredData().getLast()).contains("VideoObject", "abc123");
        assertThat(resolver.resolve("/guides/draft")).isEmpty();
    }

    @Test
    void truncatesLongDescriptions() {
        assertThat(resolver.plain("word ".repeat(100))).hasSizeLessThanOrEqualTo(160).endsWith("…");
    }

    @Test
    void cacheKeyIgnoresTheTrailingSlash() {
        assertThat(SeoPageResolver.cacheKey("/guides/first-title/")).isEqualTo("/guides/first-title");
        assertThat(SeoPageResolver.cacheKey("/heroes/ana/")).isEqualTo("/heroes/ana");
        assertThat(SeoPageResolver.cacheKey(null)).isEqualTo("/");
    }

    @Test
    void buildsHeroAndMapGuidePagesOnlyWhenTheyHaveGuides() {
        HeroDto ana = hero("ana", "Ana", null);
        MapDto busan = new MapDto("busan", "Busan", null, null);
        when(heroService.findAll()).thenReturn(List.of(ana, hero("zarya", "Zarya", null)));
        when(mapService.getBySlug("busan")).thenReturn(busan);
        List<SeoSection> content = List.of(new SeoSection("Ana video guides", List.of(SeoItem.plain("Sleep dart"))));
        when(contentBuilder.heroGuides(ana)).thenReturn(content);
        when(contentBuilder.heroGuides(hero("zarya", "Zarya", null))).thenReturn(List.of());
        when(contentBuilder.mapGuides(busan)).thenReturn(content);

        assertThat(resolver.resolve("/heroes/ana/guides")).hasValueSatisfying(page -> {
            assertThat(page.path()).isEqualTo("/heroes/ana/guides");
            assertThat(page.title()).isEqualTo("Ana guides: spots, setups and tips");
            assertThat(page.structuredData().getFirst()).contains("BreadcrumbList", "/heroes/ana/guides");
        });
        assertThat(resolver.resolve("/heroes/zarya/guides")).isEmpty();
        assertThat(resolver.resolve("/maps/busan/guides")).hasValueSatisfying(page -> {
            assertThat(page.title()).isEqualTo("Busan guides: spots, setups and tips");
            assertThat(page.heading()).isEqualTo("Busan guides");
            assertThat(page.structuredData().getFirst()).contains("/maps/busan/guides");
        });
        assertThat(resolver.resolve("/maps/busan/perks")).isEmpty();
    }

    @Test
    void buildsTheGuideHubPageFromTheStaticPageDefinition() {
        List<SeoSection> content = List.of(new SeoSection("Guides by hero", List.of(SeoItem.plain("Ana guides (2)"))));
        when(contentBuilder.guideHub()).thenReturn(content);

        assertThat(resolver.resolve("/guides")).hasValueSatisfying(page -> {
            assertThat(page.path()).isEqualTo("/guides");
            assertThat(page.heading()).isEqualTo("Guides");
            assertThat(page.sections()).isEqualTo(content);
        });
    }

    @Test
    void hidesTheGuideHubWhileThereAreNoGuides() {
        when(contentBuilder.guideHub()).thenReturn(List.of());

        assertThat(resolver.resolve("/guides")).isEmpty();
    }
}
