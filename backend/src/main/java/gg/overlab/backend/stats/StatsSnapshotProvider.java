package gg.overlab.backend.stats;

import gg.overlab.backend.config.cache.CacheNames;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.stats.dto.HeroStatDto;
import gg.overlab.backend.stats.dto.StatsFilter;
import gg.overlab.backend.stats.dto.StatsSnapshotDto;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StatsSnapshotProvider {

    private final CurrentGameFormat currentGameFormat;
    private final HeroStatRepository heroStatRepository;
    private final StatsMapper statsMapper;
    private final SnapshotCheckService snapshotCheckService;

    @Cacheable(value = CacheNames.STATS, key = "'snapshot:' + #filter.cacheKey()", sync = true)
    @Transactional(readOnly = true)
    public StatsSnapshotDto getSnapshot(StatsFilter filter) {
        List<HeroStat> stats = filter.isAllMaps()
                ? heroStatRepository.findLatestForAllMaps(filter.queue(), currentGameFormat.get(),
                          filter.platform(), filter.region(),
                filter.tier())
                : heroStatRepository.findLatestForMap(filter.mapSlug(), filter.queue(), currentGameFormat.get(),
                          filter.platform(),
                filter.region(), filter.tier());
        if (stats.isEmpty()) {
            throw new EntityNotFoundException("Statistics", filter.cacheKey());
        }

        Map<Long, HeroStat> baselineByHero = filter.isAllMaps() ? Map.of() : loadBaseline(filter);
        List<HeroStatDto> heroes = stats.stream()
                .filter(stat -> stat.getHero().isActive())
                .map(stat -> statsMapper.toDto(stat, baselineByHero.get(stat.getHero().getId())))
                .toList();
        Instant checkedAt = SnapshotCheckService.latest(stats.get(0).getCapturedAt(), snapshotCheckService.lastChecked(
                filter.queue(), filter.platform(), filter.region(), filter.tier(), filter.mapSlug()));
        return new StatsSnapshotDto(checkedAt, filter.queue(), filter.tier(), filter.mapSlug(),
                filter.platform(), filter.region(), heroes);
    }

    private Map<Long, HeroStat> loadBaseline(StatsFilter filter) {
        Map<Long, HeroStat> baselineByHero = new HashMap<>();
        heroStatRepository.findLatestForAllMaps(filter.queue(), currentGameFormat.get(),
                filter.platform(), filter.region(), filter.tier())
                .forEach(stat -> baselineByHero.put(stat.getHero().getId(), stat));
        return baselineByHero;
    }
}
