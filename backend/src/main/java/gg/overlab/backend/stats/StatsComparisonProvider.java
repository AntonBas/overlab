package gg.overlab.backend.stats;

import gg.overlab.backend.hero.HeroRoleChangeRepository;
import gg.overlab.backend.stats.dto.HeroChangeDto;
import gg.overlab.backend.stats.dto.HeroRoleChangeDto;
import gg.overlab.backend.stats.dto.StatsComparisonDto;
import gg.overlab.backend.stats.dto.StatsFilter;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StatsComparisonProvider {

    private final HeroStatRepository heroStatRepository;
    private final HeroRoleChangeRepository roleChangeRepository;
    private final StatsMapper statsMapper;

    @Cacheable(value = StatsSnapshotProvider.CACHE_NAME,
            key = "'compare:' + #filter.cacheKey() + ':' + #beforeCapturedAt + ':' + #afterCapturedAt")
    @Transactional(readOnly = true)
    public StatsComparisonDto compareCaptures(StatsFilter filter, Instant beforeCapturedAt, Instant afterCapturedAt) {
        Map<Long, HeroStat> beforeByHero = new HashMap<>();
        loadSnapshot(filter, beforeCapturedAt).forEach(stat -> beforeByHero.put(stat.getHero().getId(), stat));

        Map<Long, HeroRoleChangeDto> roleChanges = new HashMap<>();
        roleChangeRepository.findAllByChangedAtGreaterThanAndChangedAtLessThanEqualOrderByChangedAtDesc(
                        beforeCapturedAt, afterCapturedAt)
                .forEach(change -> roleChanges.putIfAbsent(change.getHero().getId(),
                        statsMapper.toRoleChangeDto(change)));

        List<HeroChangeDto> heroes = loadSnapshot(filter, afterCapturedAt).stream()
                .filter(stat -> beforeByHero.containsKey(stat.getHero().getId()))
                .map(stat -> statsMapper.toChangeDto(beforeByHero.get(stat.getHero().getId()), stat,
                        roleChanges.get(stat.getHero().getId())))
                .sorted(Comparator.comparing(HeroChangeDto::winRateChange).reversed())
                .toList();
        return new StatsComparisonDto(beforeCapturedAt, afterCapturedAt, filter.queue(), filter.tier(),
                filter.mapSlug(), filter.platform(), filter.region(), heroes);
    }

    private List<HeroStat> loadSnapshot(StatsFilter filter, Instant capturedAt) {
        return filter.isAllMaps()
                ? heroStatRepository.findSnapshotForAllMaps(filter.queue(), filter.platform(), filter.region(),
                filter.tier(), capturedAt)
                : heroStatRepository.findSnapshotForMap(filter.mapSlug(), filter.queue(), filter.platform(),
                filter.region(), filter.tier(), capturedAt);
    }
}
