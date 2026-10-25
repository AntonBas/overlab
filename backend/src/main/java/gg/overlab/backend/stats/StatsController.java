package gg.overlab.backend.stats;

import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.stats.dto.HeroHistoryDto;
import gg.overlab.backend.stats.dto.HeroMapStatsDto;
import gg.overlab.backend.stats.dto.StatsComparisonDto;
import gg.overlab.backend.stats.dto.StatsFilter;
import gg.overlab.backend.stats.dto.StatsSnapshotDto;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;
    private final StatsHistoryService historyService;

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

    @GetMapping("/hero/{slug}")
    public HeroMapStatsDto getHeroByMaps(
            @PathVariable String slug,
            @RequestParam(defaultValue = "COMPETITIVE") GameQueue queue,
            @RequestParam(defaultValue = "ALL") RankTier tier,
            @RequestParam(defaultValue = "PC") Platform platform,
            @RequestParam(defaultValue = "EUROPE") Region region) {
        return statsService.getHeroByMaps(slug, queue, tier, platform, region);
    }

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
        return historyService.getHeroHistory(slug, filter, from, to);
    }

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
        return historyService.compare(filter, from, to);
    }
}
