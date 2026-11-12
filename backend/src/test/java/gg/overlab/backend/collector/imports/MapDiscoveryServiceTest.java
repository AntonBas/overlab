package gg.overlab.backend.collector.imports;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.collector.CollectorMetrics;
import gg.overlab.backend.collector.client.BlizzardRatesPageClient;
import gg.overlab.backend.collector.parser.MapListParser;
import gg.overlab.backend.collector.parser.ParsedMap;
import gg.overlab.backend.gamemap.GameMap;
import gg.overlab.backend.gamemap.GameMapRepository;
import gg.overlab.backend.gamemap.MapMode;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class MapDiscoveryServiceTest {

    private final BlizzardRatesPageClient pageClient = mock(BlizzardRatesPageClient.class);
    private final MapListParser parser = mock(MapListParser.class);
    private final GameMapRepository repository = mock(GameMapRepository.class);
    private final CollectorMetrics metrics = mock(CollectorMetrics.class);
    private final MapDiscoveryService service = new MapDiscoveryService(pageClient, parser, repository, metrics);

    @Test
    void createsAMapThatIsNotKnownYetWithItsModeAndName() {
        when(pageClient.fetch()).thenReturn(Optional.of("page"));
        when(parser.parse("page")).thenReturn(List.of(new ParsedMap("new-map", "New Map", MapMode.CLASH)));
        when(repository.findBySlug("new-map")).thenReturn(Optional.empty());

        int created = service.discover();

        ArgumentCaptor<GameMap> saved = ArgumentCaptor.forClass(GameMap.class);
        verify(repository).save(saved.capture());
        assertThat(created).isEqualTo(1);
        assertThat(saved.getValue().getSlug()).isEqualTo("new-map");
        assertThat(saved.getValue().getName()).isEqualTo("New Map");
        assertThat(saved.getValue().getMode()).isEqualTo(MapMode.CLASH);
        verify(metrics).recordNewMap();
    }

    @Test
    void leavesAKnownMapAloneEvenWhenItsNameWasEdited() {
        GameMap known = new GameMap();
        known.setSlug("busan");
        known.setName("Busan (edited)");
        known.setMode(MapMode.CONTROL);
        when(pageClient.fetch()).thenReturn(Optional.of("page"));
        when(parser.parse("page")).thenReturn(List.of(new ParsedMap("busan", "Busan", MapMode.CONTROL)));
        when(repository.findBySlug("busan")).thenReturn(Optional.of(known));

        assertThat(service.discover()).isZero();

        verify(repository, never()).save(any(GameMap.class));
        assertThat(known.getName()).isEqualTo("Busan (edited)");
    }

    @Test
    void fillsAMissingModeOfAKnownMap() {
        GameMap known = new GameMap();
        known.setSlug("busan");
        known.setName("Busan");
        when(pageClient.fetch()).thenReturn(Optional.of("page"));
        when(parser.parse("page")).thenReturn(List.of(new ParsedMap("busan", "Busan", MapMode.CONTROL)));
        when(repository.findBySlug("busan")).thenReturn(Optional.of(known));

        service.discover();

        assertThat(known.getMode()).isEqualTo(MapMode.CONTROL);
        verify(repository).save(known);
    }

    @Test
    void doesNothingWhenThePageIsMissingOrHasNoMaps() {
        when(pageClient.fetch()).thenReturn(Optional.empty());
        assertThat(service.discover()).isZero();

        when(pageClient.fetch()).thenReturn(Optional.of("page"));
        when(parser.parse("page")).thenReturn(List.of());
        assertThat(service.discover()).isZero();

        verify(repository, never()).save(any(GameMap.class));
    }
}
