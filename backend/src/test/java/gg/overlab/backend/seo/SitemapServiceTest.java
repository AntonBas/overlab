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

    private final HeroService heroService = mock(HeroService.class);
    private final MapService mapService = mock(MapService.class);
    private final GuideService guideService = mock(GuideService.class);
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
        when(snapshotCheckService.latestChange()).thenReturn(Optional.of(Instant.parse("2026-11-10T04:00:00Z")));

        String xml = new SitemapService(heroService, mapService, guideService, new SiteUrl("https://example.com/"),
                snapshotCheckService).build();

        assertThat(xml).contains("<loc>https://example.com/stats</loc>", "<loc>https://example.com/perks</loc>",
                "<loc>https://example.com/heroes/ana</loc>", "<loc>https://example.com/maps/busan</loc>",
                "<loc>https://example.com/heroes</loc>", "<loc>https://example.com/counters</loc>",
                "<loc>https://example.com/guides/7-sleep-dart</loc>");
        assertThat(xml).doesNotContain("//stats");
        assertThat(xml).contains("<loc>https://example.com/heroes/ana</loc><lastmod>2026-11-10T04:00:00Z</lastmod>",
                "<loc>https://example.com/maps/busan</loc><lastmod>2026-11-10T04:00:00Z</lastmod>");
    }
}
