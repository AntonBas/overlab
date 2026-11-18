package gg.overlab.backend.stats;

import gg.overlab.backend.config.cache.CacheNames;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.stats.dto.DataFreshnessDto;
import gg.overlab.backend.stats.dto.StatsFilter;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StatsFreshnessService {

    private static final int MAX_SNAPSHOTS = 30;

    private final CurrentGameFormat currentGameFormat;
    private final HeroStatRepository heroStatRepository;
    private final SnapshotCheckService snapshotCheckService;

    @Cacheable(value = CacheNames.STATS, key = "'freshness:' + #filter.cacheKey()", sync = true)
    @Transactional(readOnly = true)
    public DataFreshnessDto freshness(StatsFilter filter) {
        List<Instant> times = heroStatRepository.findRecentCaptureTimes(filter.queue(), currentGameFormat.get(),
                filter.platform(),
                filter.region(), filter.tier(), PageRequest.of(0, MAX_SNAPSHOTS));
        if (times.isEmpty()) {
            throw new EntityNotFoundException("Statistics", filter.cacheKey());
        }
        Map<Instant, String> signatures = heroStatRepository.findRatesAt(filter.queue(), currentGameFormat.get(),
                filter.platform(),
                        filter.region(), filter.tier(), times).stream()
                .collect(Collectors.groupingBy(RateRow::capturedAt,
                        Collectors.collectingAndThen(Collectors.toList(), StatsFreshnessService::signatureOf)));
        String current = signatures.get(times.get(0));
        Instant valuesSince = times.get(0);
        boolean changeObserved = false;
        for (Instant time : times) {
            if (Objects.equals(signatures.get(time), current)) {
                valuesSince = time;
            } else {
                changeObserved = true;
                break;
            }
        }
        Instant checkedAt = SnapshotCheckService.latest(times.get(0), snapshotCheckService.lastChecked(filter.queue(),
                filter.platform(), filter.region(), filter.tier(), StatsFilter.ALL_MAPS));
        return new DataFreshnessDto(times.get(0), checkedAt, valuesSince, times.size(), changeObserved);
    }

    private static String signatureOf(List<RateRow> rows) {
        return SnapshotSignature.of(rows.stream()
                .map(row -> new SnapshotSignature.Entry(String.valueOf(row.heroId()), row.winRate(), row.pickRate(),
                        row.banRate()))
                .toList());
    }
}
