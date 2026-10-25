package gg.overlab.backend.collector;

import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.collector.run.CollectorRunDto;
import gg.overlab.backend.collector.run.CollectorRunRepository;
import gg.overlab.backend.collector.run.CollectorTrigger;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/collector")
@RequiredArgsConstructor
public class CollectorAdminController {

    private final RatesCollectorService collectorService;
    private final CollectorRunRepository runRepository;
    private final AuditService auditService;

    @GetMapping("/jobs")
    public List<CollectorJobDto> jobs() {
        return collectorService.jobs().stream()
                .map(job -> new CollectorJobDto(job.name(), job.cron(), job.enabled()))
                .toList();
    }

    @GetMapping("/runs")
    public List<CollectorRunDto> runs() {
        return runRepository.findTop50ByOrderByStartedAtDesc().stream().map(CollectorRunDto::from).toList();
    }

    @PostMapping("/jobs/{name}/run")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public CollectorRunDto run(@PathVariable String name) {
        CollectorRunDto run = collectorService.startAsync(name, CollectorTrigger.MANUAL);
        auditService.logCreate("CollectorRun", run.id(), run);
        return run;
    }

    public record CollectorJobDto(String name, String cron, boolean enabled) {
    }
}
