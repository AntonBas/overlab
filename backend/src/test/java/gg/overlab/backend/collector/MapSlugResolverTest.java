package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.collector.imports.MapDiscoveryService;
import gg.overlab.backend.gamemap.GameMap;
import gg.overlab.backend.gamemap.GameMapRepository;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.RankTier;
import java.util.List;
import org.junit.jupiter.api.Test;

class MapSlugResolverTest {

    private final GameMapRepository repository = mock(GameMapRepository.class);
    private final MapDiscoveryService discovery = mock(MapDiscoveryService.class);
    private final MapSlugResolver resolver = new MapSlugResolver(repository, discovery);

    private CollectorJob jobWithMaps(String... maps) {
        return CollectorFixtures.job("maps", List.of(GameQueue.COMPETITIVE), List.of(RankTier.ALL),
                List.of(maps));
    }

    private GameMap map(String slug) {
        GameMap map = new GameMap();
        map.setSlug(slug);
        return map;
    }

    @Test
    void keepsExplicitSlugsWithoutTouchingTheDatabase() {
        assertThat(resolver.resolve(jobWithMaps("all-maps", "busan"))).containsExactly("all-maps", "busan");
    }

    @Test
    void expandsEachIntoEveryKnownMapAfterDiscovery() {
        when(repository.findAll()).thenReturn(List.of(map("busan"), map("rialto")));

        assertThat(resolver.resolve(jobWithMaps("EACH"))).containsExactly("busan", "rialto");
        verify(discovery).discover();
    }

    @Test
    void usesKnownMapsWhenDiscoveryFails() {
        doThrow(new IllegalStateException("page changed")).when(discovery).discover();
        when(repository.findAll()).thenReturn(List.of(map("busan")));

        assertThat(resolver.resolve(jobWithMaps("EACH"))).containsExactly("busan");
    }
}
