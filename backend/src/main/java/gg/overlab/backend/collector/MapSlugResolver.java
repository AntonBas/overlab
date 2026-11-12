package gg.overlab.backend.collector;

import gg.overlab.backend.collector.imports.MapDiscoveryService;
import gg.overlab.backend.gamemap.GameMapRepository;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MapSlugResolver {

    private static final String EACH_MAP = "EACH";

    private final GameMapRepository gameMapRepository;
    private final MapDiscoveryService mapDiscovery;

    List<String> resolve(CollectorJob job) {
        List<String> slugs = new ArrayList<>();
        for (String map : job.maps()) {
            if (EACH_MAP.equals(map)) {
                discoverMaps();
                gameMapRepository.findAll().forEach(gameMap -> slugs.add(gameMap.getSlug()));
            } else {
                slugs.add(map);
            }
        }
        return slugs;
    }

    private void discoverMaps() {
        try {
            mapDiscovery.discover();
        } catch (RuntimeException exception) {
            log.warn("Map discovery failed: {}", exception.getMessage());
        }
    }
}
