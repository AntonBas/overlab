package gg.overlab.backend.stats;

import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.stats.dto.DataFreshnessDto;
import gg.overlab.backend.stats.dto.HeroHistoryDto;
import gg.overlab.backend.stats.dto.HeroMapStatsDto;
import gg.overlab.backend.stats.dto.HistoryStartDto;
import gg.overlab.backend.stats.dto.StatsComparisonDto;
import gg.overlab.backend.stats.dto.StatsFilter;
import gg.overlab.backend.stats.dto.StatsSnapshotDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Statistics")
@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;
    private final StatsHistoryService historyService;
    private final StatsFreshnessService freshnessService;

    @Operation(summary = "Latest hero statistics for the selected filters")
    @GetMapping
    public StatsSnapshotDto getStats(
            @RequestParam(defaultValue = "COMPETITIVE") GameQueue queue,
            @RequestParam(defaultValue = "ALL") RankTier tier,
            @RequestParam(name = "map", defaultValue = StatsFilter.ALL_MAPS) String mapSlug,
            @RequestParam(defaultValue = "PC") Platform platform,
            @RequestParam(defaultValue = "EUROPE") Region region,
            @RequestParam(required = false) HeroRole role,
            @RequestParam(defaultValue = "PICK_RATE") StatsSort sort,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction) {
        StatsFilter filter = StatsFilter.of(queue, tier, mapSlug, platform, region);
        return statsService.getStats(filter, role, sort, direction == Sort.Direction.DESC);
    }

    @Operation(summary = "Latest statistics of one hero broken down by map")
    @GetMapping("/hero/{slug}")
    public HeroMapStatsDto getHeroByMaps(
            @PathVariable String slug,
            @RequestParam(defaultValue = "COMPETITIVE") GameQueue queue,
            @RequestParam(defaultValue = "ALL") RankTier tier,
            @RequestParam(defaultValue = "PC") Platform platform,
            @RequestParam(defaultValue = "EUROPE") Region region) {
        return statsService.getHeroByMaps(slug, queue, tier, platform, region);
    }

    @Operation(summary = "Statistics history of one hero over time")
    @GetMapping("/hero/{slug}/history")
    public HeroHistoryDto getHeroHistory(
            @PathVariable String slug,
            @RequestParam(defaultValue = "COMPETITIVE") GameQueue queue,
            @RequestParam(defaultValue = "ALL") RankTier tier,
            @RequestParam(name = "map", defaultValue = StatsFilter.ALL_MAPS) String mapSlug,
            @RequestParam(defaultValue = "PC") Platform platform,
            @RequestParam(defaultValue = "EUROPE") Region region,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        StatsFilter filter = StatsFilter.of(queue, tier, mapSlug, platform, region);
        return historyService.getHeroHistory(slug, filter, floorToHour(from), ceilToHour(to));
    }

    @Operation(summary = "When the numbers collected from Blizzard last changed")
    @GetMapping("/freshness")
    public DataFreshnessDto freshness(
            @RequestParam(defaultValue = "COMPETITIVE") GameQueue queue,
            @RequestParam(defaultValue = "ALL") RankTier tier,
            @RequestParam(defaultValue = "PC") Platform platform,
            @RequestParam(defaultValue = "EUROPE") Region region) {
        return freshnessService.freshness(StatsFilter.of(queue, tier, StatsFilter.ALL_MAPS, platform, region));
    }

    @Operation(summary = "When statistics collection started for the given filters")
    @GetMapping("/history-start")
    public HistoryStartDto historyStart(
            @RequestParam(defaultValue = "COMPETITIVE") GameQueue queue,
            @RequestParam(defaultValue = "ALL") RankTier tier,
            @RequestParam(defaultValue = "PC") Platform platform,
            @RequestParam(defaultValue = "EUROPE") Region region) {
        return historyService.historyStart(StatsFilter.of(queue, tier, StatsFilter.ALL_MAPS, platform, region));
    }

    @Operation(summary = "Compare statistics between two periods or around a patch")
    @GetMapping("/compare")
    public StatsComparisonDto compare(
            @RequestParam(defaultValue = "COMPETITIVE") GameQueue queue,
            @RequestParam(defaultValue = "ALL") RankTier tier,
            @RequestParam(name = "map", defaultValue = StatsFilter.ALL_MAPS) String mapSlug,
            @RequestParam(defaultValue = "PC") Platform platform,
            @RequestParam(defaultValue = "EUROPE") Region region,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) String patch) {
        StatsFilter filter = StatsFilter.of(queue, tier, mapSlug, platform, region);
        if (patch != null) {
            return historyService.compareAroundPatch(filter, patch);
        }
        if (from == null || to == null) {
            throw new BadRequestException("Provide either 'patch' or both 'from' and 'to'");
        }
        return historyService.compare(filter, floorToHour(from), ceilToHour(to));
    }

    private static Instant floorToHour(Instant value) {
        return value == null ? null : value.truncatedTo(ChronoUnit.HOURS);
    }

    private static Instant ceilToHour(Instant value) {
        if (value == null) {
            return null;
        }
        Instant floor = value.truncatedTo(ChronoUnit.HOURS);
        return floor.equals(value) ? floor : floor.plus(1, ChronoUnit.HOURS);
    }
}
