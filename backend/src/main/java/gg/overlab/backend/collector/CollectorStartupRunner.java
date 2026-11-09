package gg.overlab.backend.collector;

import gg.overlab.backend.collector.run.CollectorRunRepository;
import gg.overlab.backend.collector.run.CollectorRunStatus;
import gg.overlab.backend.collector.run.CollectorTrigger;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Component
@RequiredArgsConstructor
public class CollectorStartupRunner implements ApplicationRunner {

    private static final String INTERRUPTED_SUMMARY = "Interrupted by a backend restart";

    private final CollectorProperties properties;
    private final RatesCollectorService collectorService;
    private final CollectorRunRepository runRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        int interrupted = runRepository.failRunningRuns(CollectorRunStatus.RUNNING, CollectorRunStatus.FAILED,
                Instant.now(), INTERRUPTED_SUMMARY);
        if (interrupted > 0) {
            log.warn("{} collector run(s) were interrupted by a restart and marked as failed", interrupted);
        }
        if (StringUtils.hasText(properties.startupJob())) {
            collectorService.runBlocking(properties.startupJob(), CollectorTrigger.STARTUP);
        }
    }
}
