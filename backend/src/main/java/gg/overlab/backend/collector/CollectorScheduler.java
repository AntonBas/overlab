package gg.overlab.backend.collector;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;

@Configuration
@EnableScheduling
@RequiredArgsConstructor
public class CollectorScheduler implements SchedulingConfigurer {

    private final CollectorProperties properties;
    private final RatesCollectorService collectorService;

    @Override
    public void configureTasks(ScheduledTaskRegistrar registrar) {
        for (CollectorJob job : properties.jobs()) {
            registrar.addCronTask(() -> collectorService.collect(job), job.cron());
        }
    }
}
