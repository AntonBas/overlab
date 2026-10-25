package gg.overlab.backend.stats;

import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.stats.dto.HeroStatDto;
import gg.overlab.backend.stats.dto.StatsFilter;
import gg.overlab.backend.stats.dto.StatsSnapshotDto;
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

    public static final String CACHE_NAME = "stats";

    private final HeroStatRepository heroStatRepository;
    private final StatsMapper statsMapper;

    @Cacheable(value = CACHE_NAME, key = "'snapshot:' + #filter.cacheKey()")
    @Transactional(readOnly = true)
    public StatsSnapshotDto getSnapshot(StatsFilter filter) {
        List<HeroStat> stats = filter.isAllMaps()
                ? heroStatRepository.findLatestForAllMaps(filter.queue(), filter.platform(), filter.region(),
                filter.tier())
                : heroStatRepository.findLatestForMap(filter.mapSlug(), filter.queue(), filter.platform(),
                filter.region(), filter.tier());
        if (stats.isEmpty()) {
            throw new EntityNotFoundException("Statistics", filter.cacheKey());
        }

        Map<Long, HeroStat> baselineByHero = filter.isAllMaps() ? Map.of() : loadBaseline(filter);
        List<HeroStatDto> heroes = stats.stream()
                .map(stat -> statsMapper.toDto(stat, baselineByHero.get(stat.getHero().getId())))
                .toList();
        return new StatsSnapshotDto(stats.get(0).getCapturedAt(), filter.queue(), filter.tier(), filter.mapSlug(),
                filter.platform(), filter.region(), heroes);
    }

    private Map<Long, HeroStat> loadBaseline(StatsFilter filter) {
        Map<Long, HeroStat> baselineByHero = new HashMap<>();
        heroStatRepository.findLatestForAllMaps(filter.queue(), filter.platform(), filter.region(), filter.tier())
                .forEach(stat -> baselineByHero.put(stat.getHero().getId(), stat));
        return baselineByHero;
    }
}
