package gg.overlab.backend.seo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import gg.overlab.backend.gamemap.GameMap;
import gg.overlab.backend.gamemap.GameMapRepository;
import gg.overlab.backend.guide.Guide;
import gg.overlab.backend.guide.GuideRepository;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class SeoPageResolverTest {

    private final HeroRepository heroRepository = mock(HeroRepository.class);
    private final GameMapRepository mapRepository = mock(GameMapRepository.class);
    private final GuideRepository guideRepository = mock(GuideRepository.class);
    private final SeoPageResolver resolver =
            new SeoPageResolver(heroRepository, mapRepository, guideRepository, "https://example.com/");

    @Test
    void resolvesStaticPagesAndIgnoresTrailingSlash() {
        assertThat(resolver.resolve("/stats/")).hasValueSatisfying(page -> {
            assertThat(page.title()).isEqualTo("Overwatch 2 hero win, pick and ban rates");
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
        Hero hero = new Hero();
        hero.setSlug("ana");
        hero.setName("Ana");
        hero.setDescription("Heals allies and counters [[hero/reinhardt]].");
        when(heroRepository.findBySlug("ana")).thenReturn(Optional.of(hero));

        SeoPage page = resolver.resolve("/heroes/ana").orElseThrow();

        assertThat(page.title()).isEqualTo("Ana stats, perks, counters and best maps");
        assertThat(page.heading()).isEqualTo("Ana");
        assertThat(page.description()).startsWith("Ana Overwatch 2 stats: win, pick and ban rates, perks, counters")
                .contains("Heals allies and counters reinhardt.");
        assertThat(page.structuredData().getFirst()).contains("BreadcrumbList", "https://example.com/heroes");
    }

    @Test
    void hidesInactiveHeroesAndUnknownMaps() {
        Hero hero = new Hero();
        hero.setSlug("old");
        hero.setActive(false);
        when(heroRepository.findBySlug("old")).thenReturn(Optional.of(hero));
        when(mapRepository.findBySlug("nowhere")).thenReturn(Optional.empty());

        assertThat(resolver.resolve("/heroes/old")).isEmpty();
        assertThat(resolver.resolve("/maps/nowhere")).isEmpty();
    }

    @Test
    void buildsMapPage() {
        GameMap map = new GameMap();
        map.setSlug("busan");
        map.setName("Busan");
        when(mapRepository.findBySlug("busan")).thenReturn(Optional.of(map));

        assertThat(resolver.resolve("/maps/busan")).hasValueSatisfying(page ->
                assertThat(page.description()).startsWith("Busan: win, pick and ban rates"));
    }

    @Test
    void hidesUnpublishedGuidesAndBuildsVideoDataForPublishedOnes() {
        Hero hero = new Hero();
        hero.setSlug("ana");
        hero.setName("Ana");
        Guide guide = new Guide();
        guide.setSlug("sleep-dart");
        guide.setTitle("Sleep dart tips");
        guide.setYoutubeId("abc123");
        guide.setHero(hero);
        guide.setPublished(true);
        when(guideRepository.findWithDetailsById(7L)).thenReturn(Optional.of(guide));

        SeoPage page = resolver.resolve("/guides/7-whatever").orElseThrow();

        assertThat(page.openGraphType()).isEqualTo("video.other");
        assertThat(page.structuredData().getLast()).contains("VideoObject", "abc123");

        guide.setPublished(false);
        assertThat(resolver.resolve("/guides/7-whatever")).isEmpty();
    }

    @Test
    void truncatesLongDescriptions() {
        assertThat(resolver.plain("word ".repeat(100))).hasSizeLessThanOrEqualTo(160).endsWith("…");
    }
}
