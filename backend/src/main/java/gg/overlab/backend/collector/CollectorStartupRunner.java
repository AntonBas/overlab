package gg.overlab.backend.collector;

import gg.overlab.backend.collector.run.CollectorTrigger;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class CollectorStartupRunner implements ApplicationRunner {

    private final CollectorProperties properties;
    private final RatesCollectorService collectorService;

    @Override
    public void run(ApplicationArguments args) {
        if (StringUtils.hasText(properties.startupJob())) {
            collectorService.runBlocking(properties.startupJob(), CollectorTrigger.STARTUP);
        }
    }
}
