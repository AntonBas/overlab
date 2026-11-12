package gg.overlab.backend.collector;

import gg.overlab.backend.collector.run.CollectorRun;
import gg.overlab.backend.collector.run.CollectorRunRepository;
import gg.overlab.backend.collector.run.CollectorRunStatus;
import gg.overlab.backend.collector.run.CollectorTrigger;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class JobChain {

    private final CollectorProperties properties;
    private final CollectorRunRepository runRepository;

    List<CollectorJob> dependentsToRun(CollectorJob parent, CollectorRun parentRun) {
        if (parentRun.getTrigger() == CollectorTrigger.PATCH || parentRun.getRowsSaved() == 0
                || parentRun.getStatus() == CollectorRunStatus.FAILED) {
            return List.of();
        }
        return properties.jobs().stream()
                .filter(dependent -> dependent.enabled() && parent.name().equals(dependent.after()))
                .filter(this::intervalElapsed)
                .toList();
    }

    private boolean intervalElapsed(CollectorJob job) {
        if (job.minInterval() == null) {
            return true;
        }
        boolean elapsed = runRepository
                .findFirstByJobNameAndStatusOrderByFinishedAtDesc(job.name(), CollectorRunStatus.SUCCESS)
                .map(CollectorRun::getFinishedAt)
                .map(finishedAt -> !finishedAt.plus(job.minInterval()).isAfter(Instant.now()))
                .orElse(true);
        if (!elapsed) {
            log.info("Collector job '{}' skipped: it ran less than {} ago", job.name(), job.minInterval());
        }
        return elapsed;
    }
}
