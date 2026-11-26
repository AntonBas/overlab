package gg.overlab.backend.seo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import gg.overlab.backend.gamemap.MapService;
import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.guide.GuideService;
import gg.overlab.backend.guide.dto.GuideDto;
import gg.overlab.backend.hero.HeroService;
import gg.overlab.backend.hero.dto.HeroDto;
import gg.overlab.backend.stats.SnapshotCheckService;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class SitemapServiceTest {

    @Test
    void listsGuideListPagesOnlyForHeroesAndMapsThatHaveGuides() {
        HeroDto ana = new HeroDto("ana", "Ana", null, null, null, null, null, null, false);
        HeroDto zarya = new HeroDto("zarya", "Zarya", null, null, null, null, null, null, false);
        MapDto busan = new MapDto("busan", "Busan", null, null);
        MapDto nepal = new MapDto("nepal", "Nepal", null, null);
        GuideDto guide = new GuideDto(7L, "sleep-dart", "7-sleep-dart", "ana", "Ana", "busan", "Busan", "Sleep dart",
                "abc123", 0, null, null, null, null, null, null, 0, true, Instant.parse("2026-11-12T10:00:00Z"));
        when(heroService.findAll()).thenReturn(List.of(ana, zarya));
        when(mapService.findAll()).thenReturn(List.of(busan, nepal));
        when(guideService.findPublished(null, null)).thenReturn(List.of(guide));
        when(guideService.findPublished("ana", null)).thenReturn(List.of(guide, guide));
        when(guideService.findPublished("zarya", null)).thenReturn(List.of(guide));
        when(guideService.findPublished(null, "busan")).thenReturn(List.of(guide, guide));
        when(guideService.findPublished(null, "nepal")).thenReturn(List.of());
        when(contentBuilder.heroPerks(ana)).thenReturn(List.of());
        when(contentBuilder.heroCounters(ana)).thenReturn(List.of());
        when(contentBuilder.heroMaps(ana)).thenReturn(List.of());
        when(contentBuilder.heroPerks(zarya)).thenReturn(List.of());
        when(contentBuilder.heroCounters(zarya)).thenReturn(List.of());
        when(contentBuilder.heroMaps(zarya)).thenReturn(List.of());
        when(snapshotCheckService.latestChange()).thenReturn(Optional.empty());

        String xml = new SitemapService(heroService, mapService, guideService, contentBuilder,
                new SiteUrl("https://example.com/"), snapshotCheckService).build();

        assertThat(xml).contains(
                "<loc>https://example.com/heroes/ana/guides</loc><lastmod>2026-11-12T10:00:00Z</lastmod>",
                "<loc>https://example.com/maps/busan/guides</loc><lastmod>2026-11-12T10:00:00Z</lastmod>");
        assertThat(xml).doesNotContain("/heroes/zarya/guides", "/maps/nepal/guides");
    }

    @Test
    void leavesOutTheGuideHubUntilThereIsAGuide() {
        when(heroService.findAll()).thenReturn(List.of());
        when(mapService.findAll()).thenReturn(List.of());
        when(guideService.findPublished(null, null)).thenReturn(List.of());
        when(snapshotCheckService.latestChange()).thenReturn(Optional.empty());

        String xml = new SitemapService(heroService, mapService, guideService, contentBuilder,
                new SiteUrl("https://example.com/"), snapshotCheckService).build();

        assertThat(xml).doesNotContain("https://example.com/guides<");
        assertThat(xml).contains("<loc>https://example.com/maps</loc>");
    }


    private final HeroService heroService = mock(HeroService.class);
    private final MapService mapService = mock(MapService.class);
    private final GuideService guideService = mock(GuideService.class);
    private final SeoContentBuilder contentBuilder = mock(SeoContentBuilder.class);
    private final SnapshotCheckService snapshotCheckService = mock(SnapshotCheckService.class);

    @Test
    void listsStaticPagesHeroesMapsAndGuidesWithAbsoluteUrls() {
        HeroDto hero = new HeroDto("ana", "Ana", null, null, null, null, null, null, false);
        MapDto map = new MapDto("busan", "Busan", null, null);
        GuideDto guide = new GuideDto(7L, "sleep-dart", "7-sleep-dart", "ana", "Ana", null, null, "Sleep dart",
                "abc123", 0, null, null, null, null, null, null, 0, true, null);
        when(heroService.findAll()).thenReturn(List.of(hero));
        when(mapService.findAll()).thenReturn(List.of(map));
        when(guideService.findPublished(null, null)).thenReturn(List.of(guide));
        List<SeoSection> content = List.of(new SeoSection("Content", List.of(SeoItem.plain("x"))));
        when(contentBuilder.heroPerks(hero)).thenReturn(content);
        when(contentBuilder.heroCounters(hero)).thenReturn(content);
        when(contentBuilder.heroMaps(hero)).thenReturn(List.of());
        when(snapshotCheckService.latestChange()).thenReturn(Optional.of(Instant.parse("2026-11-10T04:00:00Z")));

        String xml = new SitemapService(heroService, mapService, guideService, contentBuilder,
                new SiteUrl("https://example.com/"), snapshotCheckService).build();

        assertThat(xml).contains("<loc>https://example.com/</loc><lastmod>2026-11-10T04:00:00Z</lastmod>",
                "<loc>https://example.com/perks</loc>",
                "<loc>https://example.com/heroes/ana</loc>", "<loc>https://example.com/maps/busan</loc>",
                "<loc>https://example.com/heroes</loc>", "<loc>https://example.com/counters</loc>",
                "<loc>https://example.com/guides/7-sleep-dart</loc>",
                "<loc>https://example.com/heroes/ana/perks</loc>",
                "<loc>https://example.com/heroes/ana/counters</loc>");
        assertThat(xml).doesNotContain("/heroes/ana/maps");
        assertThat(xml).doesNotContain("/stats</loc>");
        assertThat(xml).doesNotContain("/counters/");
        assertThat(xml).contains("<loc>https://example.com/heroes/ana</loc><lastmod>2026-11-10T04:00:00Z</lastmod>",
                "<loc>https://example.com/maps/busan</loc><lastmod>2026-11-10T04:00:00Z</lastmod>");
    }
}
