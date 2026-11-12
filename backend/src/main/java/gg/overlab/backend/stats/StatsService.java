package gg.overlab.backend.stats;

import gg.overlab.backend.config.cache.CacheNames;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.hero.HeroService;
import gg.overlab.backend.hero.dto.HeroDto;
import gg.overlab.backend.stats.dto.HeroMapStatDto;
import gg.overlab.backend.stats.dto.HeroMapStatsDto;
import gg.overlab.backend.stats.dto.HeroStatDto;
import gg.overlab.backend.stats.dto.StatsFilter;
import gg.overlab.backend.stats.dto.StatsSnapshotDto;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final StatsSnapshotProvider snapshotProvider;
    private final HeroStatRepository heroStatRepository;
    private final HeroService heroService;
    private final StatsMapper statsMapper;
    private final SnapshotCheckService snapshotCheckService;

    public StatsSnapshotDto getStats(StatsFilter filter, HeroRole role, StatsSort sort, boolean descending) {
        StatsSnapshotDto snapshot = snapshotProvider.getSnapshot(filter);
        List<HeroStatDto> heroes = snapshot.heroes().stream()
                .filter(hero -> role == null || hero.role() == role)
                .sorted(sort.comparator(descending))
                .toList();
        return new StatsSnapshotDto(snapshot.capturedAt(), snapshot.queue(), snapshot.tier(), snapshot.map(),
                snapshot.platform(), snapshot.region(), heroes);
    }

    @Cacheable(value = CacheNames.STATS,
            key = "'hero:' + #heroSlug + ':' + #queue + ':' + #tier + ':' + #platform + ':' + #region")
    @Transactional(readOnly = true)
    public HeroMapStatsDto getHeroByMaps(String heroSlug, GameQueue queue, RankTier tier, Platform platform,
                                         Region region) {
        HeroDto hero = heroService.getBySlug(heroSlug);
        RankTier effectiveTier = queue == GameQueue.QUICK_PLAY ? RankTier.ALL : tier;
        List<HeroStat> stats = heroStatRepository.findLatestForHero(heroSlug, queue, platform, region, effectiveTier);
        if (stats.isEmpty()) {
            throw new EntityNotFoundException("Statistics", heroSlug);
        }

        HeroStat overallStat = stats.stream().filter(stat -> stat.getMap() == null).findFirst().orElse(null);
        Map<String, Instant> checkedAt = snapshotCheckService.lastCheckedByMap(queue, platform, region, effectiveTier);
        HeroMapStatDto overall = overallStat == null
                ? null
                : checkedAt(statsMapper.toMapDto(overallStat, null), StatsFilter.ALL_MAPS, checkedAt);
        List<HeroMapStatDto> maps = stats.stream()
                .filter(stat -> stat.getMap() != null)
                .map(stat -> checkedAt(statsMapper.toMapDto(stat, overallStat), stat.getMap().getSlug(), checkedAt))
                .sorted(Comparator.comparing(HeroMapStatDto::mapName))
                .toList();
        return new HeroMapStatsDto(hero, queue, effectiveTier, platform, region, overall, maps);
    }

    private HeroMapStatDto checkedAt(HeroMapStatDto stat, String mapKey, Map<String, Instant> checkedAt) {
        Instant checked = checkedAt.get(mapKey);
        return checked != null && checked.isAfter(stat.capturedAt()) ? stat.withCapturedAt(checked) : stat;
    }
}
