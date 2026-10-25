package gg.overlab.backend.stats;

import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.hero.HeroService;
import gg.overlab.backend.hero.dto.HeroDto;
import gg.overlab.backend.stats.dto.HeroMapStatDto;
import gg.overlab.backend.stats.dto.HeroMapStatsDto;
import gg.overlab.backend.stats.dto.HeroStatDto;
import gg.overlab.backend.stats.dto.StatsFilter;
import gg.overlab.backend.stats.dto.StatsSnapshotDto;
import java.util.Comparator;
import java.util.List;
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

    public StatsSnapshotDto getStats(StatsFilter filter, HeroRole role, StatsSort sort, boolean descending) {
        StatsSnapshotDto snapshot = snapshotProvider.getSnapshot(filter);
        List<HeroStatDto> heroes = snapshot.heroes().stream()
                .filter(hero -> role == null || hero.role() == role)
                .sorted(sort.comparator(descending))
                .toList();
        return new StatsSnapshotDto(snapshot.capturedAt(), snapshot.queue(), snapshot.tier(), snapshot.map(),
                snapshot.platform(), snapshot.region(), heroes);
    }

    @Cacheable(value = StatsSnapshotProvider.CACHE_NAME,
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
        HeroMapStatDto overall = overallStat == null ? null : statsMapper.toMapDto(overallStat, null);
        List<HeroMapStatDto> maps = stats.stream()
                .filter(stat -> stat.getMap() != null)
                .map(stat -> statsMapper.toMapDto(stat, overallStat))
                .sorted(Comparator.comparing(HeroMapStatDto::mapName))
                .toList();
        return new HeroMapStatsDto(hero, queue, effectiveTier, platform, region, overall, maps);
    }
}
