package gg.overlab.backend.collector.imports;

import gg.overlab.backend.collector.CollectorMetrics;
import gg.overlab.backend.collector.client.BlizzardRatesPageClient;
import gg.overlab.backend.collector.parser.MapListParser;
import gg.overlab.backend.collector.parser.ParsedMap;
import gg.overlab.backend.gamemap.GameMap;
import gg.overlab.backend.gamemap.GameMapRepository;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class MapDiscoveryService {

    private final BlizzardRatesPageClient pageClient;
    private final MapListParser parser;
    private final GameMapRepository gameMapRepository;
    private final CollectorMetrics metrics;

    @Transactional
    public int discover() {
        Optional<String> page = pageClient.fetch();
        if (page.isEmpty()) {
            log.warn("Blizzard rates page is not available, map discovery skipped");
            return 0;
        }
        List<ParsedMap> parsed = parser.parse(page.get());
        if (parsed.isEmpty()) {
            log.warn("No maps found on the Blizzard rates page, its markup may have changed");
            return 0;
        }
        int created = 0;
        for (ParsedMap map : parsed) {
            Optional<GameMap> existing = gameMapRepository.findBySlug(map.slug());
            if (existing.isEmpty()) {
                create(map);
                created++;
            } else if (existing.get().getMode() == null && map.mode() != null) {
                existing.get().setMode(map.mode());
                gameMapRepository.save(existing.get());
            }
        }
        return created;
    }

    private void create(ParsedMap parsed) {
        log.warn("New map discovered: {} ({}), set its image in the admin panel", parsed.slug(), parsed.mode());
        metrics.recordNewMap(parsed.slug());
        GameMap map = new GameMap();
        map.setSlug(parsed.slug());
        map.setName(parsed.name());
        map.setMode(parsed.mode());
        gameMapRepository.save(map);
    }
}
