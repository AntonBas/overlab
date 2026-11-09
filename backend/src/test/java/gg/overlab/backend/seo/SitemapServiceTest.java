package gg.overlab.backend.seo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import gg.overlab.backend.gamemap.GameMap;
import gg.overlab.backend.gamemap.GameMapRepository;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import java.util.List;
import org.junit.jupiter.api.Test;

class SitemapServiceTest {

    private final HeroRepository heroRepository = mock(HeroRepository.class);
    private final GameMapRepository mapRepository = mock(GameMapRepository.class);

    @Test
    void listsStaticPagesActiveHeroesAndMapsWithAbsoluteUrls() {
        Hero hero = new Hero();
        hero.setSlug("ana");
        GameMap map = new GameMap();
        map.setSlug("busan");
        when(heroRepository.findAllByActiveTrueOrderByNameAsc()).thenReturn(List.of(hero));
        when(mapRepository.findAllByOrderByNameAsc()).thenReturn(List.of(map));

        String xml = new SitemapService(heroRepository, mapRepository, "https://example.com/").build();

        assertThat(xml).contains("<loc>https://example.com/stats</loc>", "<loc>https://example.com/perks</loc>",
                "<loc>https://example.com/heroes/ana</loc>", "<loc>https://example.com/maps/busan</loc>");
        assertThat(xml).doesNotContain("//stats");
    }
}
