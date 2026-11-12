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
    private final SeoPageResolver resolver =
            new SeoPageResolver(heroService, mapService, guideService, "https://example.com/");

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
        assertThat(resolver.resolve("/")).hasValueSatisfying(page -> assertThat(page.title()).isEqualTo("Overlab"));
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
    void buildsMapPage() {
        when(mapService.getBySlug("busan")).thenReturn(new MapDto("busan", "Busan", null, null));

        assertThat(resolver.resolve("/maps/busan")).hasValueSatisfying(page ->
                assertThat(page.description()).startsWith("Busan: win, pick and ban rates"));
    }

    @Test
    void buildsVideoDataForAPublishedGuideAndHidesUnknownOnes() {
        GuideDto guide = new GuideDto(7L, "sleep-dart", "7-sleep-dart", "ana", "Ana", null, null, "Sleep dart tips",
                "abc123", 0, null, null, null, null, null, null, 0, true, null);
        when(guideService.getPublishedByPath("7-whatever")).thenReturn(guide);
        when(guideService.getPublishedByPath("8-draft")).thenThrow(new EntityNotFoundException("Guide", "8-draft"));

        SeoPage page = resolver.resolve("/guides/7-whatever").orElseThrow();

        assertThat(page.openGraphType()).isEqualTo("video.other");
        assertThat(page.structuredData().getLast()).contains("VideoObject", "abc123");
        assertThat(resolver.resolve("/guides/8-draft")).isEmpty();
    }

    @Test
    void truncatesLongDescriptions() {
        assertThat(resolver.plain("word ".repeat(100))).hasSizeLessThanOrEqualTo(160).endsWith("…");
    }

    @Test
    void cacheKeyIgnoresTheGuideSlugAndTrailingSlash() {
        assertThat(SeoPageResolver.cacheKey("/guides/12-first-title")).isEqualTo("/guides/12");
        assertThat(SeoPageResolver.cacheKey("/guides/12-another/")).isEqualTo("/guides/12");
        assertThat(SeoPageResolver.cacheKey("/heroes/ana/")).isEqualTo("/heroes/ana");
        assertThat(SeoPageResolver.cacheKey(null)).isEqualTo("/");
    }
}
