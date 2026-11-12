package gg.overlab.backend.stats;

import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.stats.dto.CoverageDto;
import gg.overlab.backend.stats.dto.DataFreshnessDto;
import gg.overlab.backend.stats.dto.HeroHistoryDto;
import gg.overlab.backend.stats.dto.HeroMapStatsDto;
import gg.overlab.backend.stats.dto.HistoryStartDto;
import gg.overlab.backend.stats.dto.StatsComparisonDto;
import gg.overlab.backend.stats.dto.StatsFilter;
import gg.overlab.backend.stats.dto.StatsQuery;
import gg.overlab.backend.stats.dto.StatsSnapshotDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
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
    private final StatsCoverageService coverageService;

    @Operation(summary = "Latest hero statistics for the selected filters")
    @GetMapping
    public StatsSnapshotDto getStats(
            @ModelAttribute StatsQuery query,
            @RequestParam(required = false) HeroRole role,
            @RequestParam(defaultValue = "PICK_RATE") StatsSort sort,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction) {
        return statsService.getStats(query.filter(), role, sort, direction == Sort.Direction.DESC);
    }

    @Operation(summary = "Latest statistics of one hero broken down by map")
    @GetMapping("/hero/{slug}")
    public HeroMapStatsDto getHeroByMaps(
            @PathVariable String slug, @ModelAttribute StatsQuery query) {
        return statsService.getHeroByMaps(slug, query.getQueue(), query.getTier(), query.getPlatform(),
                query.getRegion());
    }

    @Operation(summary = "Statistics history of one hero over time")
    @GetMapping("/hero/{slug}/history")
    public HeroHistoryDto getHeroHistory(
            @PathVariable String slug,
            @ModelAttribute StatsQuery query,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return historyService.getHeroHistory(slug, query.filter(), floorToHour(from), ceilToHour(to));
    }

    @Operation(summary = "When the numbers collected from Blizzard last changed")
    @GetMapping("/freshness")
    public DataFreshnessDto freshness(
            @ModelAttribute StatsQuery query) {
        return freshnessService.freshness(query.overallFilter());
    }

    @Operation(summary = "Which platforms, regions, ranks and maps have collected statistics")
    @GetMapping("/coverage")
    public List<CoverageDto> coverage() {
        return coverageService.coverage();
    }

    @Operation(summary = "When statistics collection started for the given filters")
    @GetMapping("/history-start")
    public HistoryStartDto historyStart(
            @ModelAttribute StatsQuery query) {
        return historyService.historyStart(query.overallFilter());
    }

    @Operation(summary = "Compare statistics between two periods or around a patch")
    @GetMapping("/compare")
    public StatsComparisonDto compare(
            @ModelAttribute StatsQuery query,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(required = false) String patch) {
        StatsFilter filter = query.filter();
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
