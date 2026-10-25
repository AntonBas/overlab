package gg.overlab.backend.collector;

import gg.overlab.backend.collector.run.CollectorTrigger;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;

@Slf4j
@Configuration
@EnableScheduling
@RequiredArgsConstructor
public class CollectorScheduler implements SchedulingConfigurer {

    private final CollectorProperties properties;
    private final RatesCollectorService collectorService;

    @Override
    public void configureTasks(ScheduledTaskRegistrar registrar) {
        for (CollectorJob job : properties.jobs()) {
            if (job.enabled()) {
                registrar.addCronTask(() -> collectorService.runBlocking(job.name(), CollectorTrigger.SCHEDULED),
                        job.cron());
            } else {
                log.info("Collector job '{}' is disabled and will not be scheduled", job.name());
            }
        }
    }
}
