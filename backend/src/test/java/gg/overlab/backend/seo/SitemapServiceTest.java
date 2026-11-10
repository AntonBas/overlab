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
import java.util.List;
import org.junit.jupiter.api.Test;

class SitemapServiceTest {

    private final HeroRepository heroRepository = mock(HeroRepository.class);
    private final GameMapRepository mapRepository = mock(GameMapRepository.class);
    private final GuideRepository guideRepository = mock(GuideRepository.class);

    @Test
    void listsStaticPagesActiveHeroesAndMapsWithAbsoluteUrls() {
        Hero hero = new Hero();
        hero.setSlug("ana");
        GameMap map = new GameMap();
        map.setSlug("busan");
        when(heroRepository.findAllByActiveTrueOrderByNameAsc()).thenReturn(List.of(hero));
        Guide guide = new Guide();
        guide.setSlug("sleep-dart");
        when(mapRepository.findAllByOrderByNameAsc()).thenReturn(List.of(map));
        when(guideRepository.findAllByPublishedTrueOrderBySortOrderAscIdAsc()).thenReturn(List.of(guide));

        String xml = new SitemapService(heroRepository, mapRepository, guideRepository, "https://example.com/").build();

        assertThat(xml).contains("<loc>https://example.com/stats</loc>", "<loc>https://example.com/perks</loc>",
                "<loc>https://example.com/heroes/ana</loc>", "<loc>https://example.com/maps/busan</loc>", "<loc>https://example.com/heroes</loc>",
                "<loc>https://example.com/counters</loc>", "-sleep-dart</loc>");
        assertThat(xml).doesNotContain("//stats");
    }
}
