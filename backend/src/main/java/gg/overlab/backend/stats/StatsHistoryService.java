package gg.overlab.backend.stats;

import gg.overlab.backend.config.cache.CacheNames;
import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.gamemap.MapService;
import gg.overlab.backend.hero.HeroService;
import gg.overlab.backend.hero.dto.HeroDto;
import gg.overlab.backend.patch.PatchService;
import gg.overlab.backend.patch.dto.PatchDto;
import gg.overlab.backend.stats.dto.HeroHistoryDto;
import gg.overlab.backend.stats.dto.HeroHistoryPointDto;
import gg.overlab.backend.stats.dto.HistoryStartDto;
import gg.overlab.backend.stats.dto.StatsComparisonDto;
import gg.overlab.backend.stats.dto.StatsFilter;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StatsHistoryService {

    public static final Duration DEFAULT_HISTORY_RANGE = Duration.ofDays(90);
    public static final Duration MAX_HISTORY_RANGE = Duration.ofDays(366);
    public static final Duration PATCH_COMPARISON_WINDOW = Duration.ofDays(7);

    private final CurrentGameFormat currentGameFormat;
    private final HeroStatRepository heroStatRepository;
    private final HeroService heroService;
    private final MapService mapService;
    private final PatchService patchService;
    private final StatsComparisonProvider comparisonProvider;
    private final StatsMapper statsMapper;

    @Cacheable(value = CacheNames.STATS,
            key = "'history:' + #heroSlug + ':' + #filter.cacheKey()"
                    + " + (#from == null && #to == null ? '' : ':' + T(gg.overlab.backend.stats.StatsHistoryService)"
                    + ".rangeKey(#from, #to))", sync = true)
    @Transactional(readOnly = true)
    public HeroHistoryDto getHeroHistory(String heroSlug, StatsFilter filter, Instant from, Instant to) {
        Instant requestedEnd = to == null ? Instant.now() : to;
        Instant requestedStart = from == null ? requestedEnd.minus(DEFAULT_HISTORY_RANGE) : from;
        if (requestedStart.isAfter(requestedEnd)) {
            throw new BadRequestException("'from' must not be after 'to'");
        }
        if (Duration.between(requestedStart, requestedEnd).compareTo(MAX_HISTORY_RANGE) > 0) {
            throw new BadRequestException("The requested range must not exceed " + MAX_HISTORY_RANGE.toDays()
                    + " days");
        }
        Instant start = from == null ? requestedStart : startOfDay(from);
        Instant end = to == null ? requestedEnd : startOfDay(to).plus(Duration.ofDays(1));
        HeroDto hero = heroService.getBySlug(heroSlug);
        if (!filter.isAllMaps()) {
            mapService.getBySlug(filter.mapSlug());
        }
        GameFormat format = currentGameFormat.get();
        List<HeroStat> stats = filter.isAllMaps()
                ? heroStatRepository.findHistoryForAllMaps(heroSlug, filter.queue(), format, filter.platform(),
                        filter.region(), filter.tier(), start, end)
                : heroStatRepository.findHistoryForMap(heroSlug, filter.mapSlug(), filter.queue(), format,
                        filter.platform(), filter.region(), filter.tier(), start, end);
        List<HeroHistoryPointDto> points = latestPerDay(
                stats.stream().map(statsMapper::toHistoryPoint).toList());
        return new HeroHistoryDto(hero, filter.queue(), filter.tier(), filter.mapSlug(), filter.platform(),
                filter.region(), start, end, points);
    }

    public static String rangeKey(Instant from, Instant to) {
        return (from == null ? "-" : LocalDate.ofInstant(from, ZoneOffset.UTC).toString()) + "_"
                + (to == null ? "-" : LocalDate.ofInstant(to, ZoneOffset.UTC).toString());
    }

    private static Instant startOfDay(Instant instant) {
        return LocalDate.ofInstant(instant, ZoneOffset.UTC).atStartOfDay().toInstant(ZoneOffset.UTC);
    }

    @Transactional(readOnly = true)
    public StatsComparisonDto compare(StatsFilter filter, Instant before, Instant after) {
        return buildComparison(filter, before, after);
    }

    private StatsComparisonDto buildComparison(StatsFilter filter, Instant before, Instant after) {
        if (before.isAfter(after)) {
            throw new BadRequestException("'from' must not be after 'to'");
        }
        return comparisonProvider.compareCaptures(filter, findCapture(filter, before), findCapture(filter, after));
    }

    @Transactional(readOnly = true)
    public StatsComparisonDto compareAroundPatch(StatsFilter filter, String patchSlug) {
        PatchDto patch = patchService.getBySlug(patchSlug);
        Instant windowEnd = patch.releasedAt().plus(PATCH_COMPARISON_WINDOW);
        Instant comparisonEnd = patchService.findNextAfter(patch.releasedAt())
                .map(PatchDto::releasedAt)
                .filter(nextRelease -> nextRelease.isBefore(windowEnd))
                .orElse(windowEnd);
        return buildComparison(filter, patch.releasedAt(), comparisonEnd);
    }

    @Cacheable(value = CacheNames.STATS, key = "'history-start:' + #filter.cacheKey()", sync = true)
    @Transactional(readOnly = true)
    public HistoryStartDto historyStart(StatsFilter filter) {
        return new HistoryStartDto(heroStatRepository.findFirstCaptureForAllMaps(filter.queue(),
                currentGameFormat.get(), filter.platform(), filter.region(), filter.tier()).orElse(null));
    }

    private Instant findCapture(StatsFilter filter, Instant at) {
        GameFormat format = currentGameFormat.get();
        Optional<Instant> capture = filter.isAllMaps()
                ? heroStatRepository.findCaptureAtOrBeforeForAllMaps(filter.queue(), format, filter.platform(),
                        filter.region(), filter.tier(), at)
                : heroStatRepository.findCaptureAtOrBeforeForMap(filter.mapSlug(), filter.queue(), format,
                        filter.platform(), filter.region(), filter.tier(), at);
        return capture.orElseThrow(() -> new EntityNotFoundException("Statistics snapshot", at));
    }

    private static List<HeroHistoryPointDto> latestPerDay(List<HeroHistoryPointDto> points) {
        Map<LocalDate, HeroHistoryPointDto> latestByDay = new LinkedHashMap<>();
        for (HeroHistoryPointDto point : points) {
            latestByDay.put(LocalDate.ofInstant(point.capturedAt(), ZoneOffset.UTC), point);
        }
        return List.copyOf(latestByDay.values());
    }
}
