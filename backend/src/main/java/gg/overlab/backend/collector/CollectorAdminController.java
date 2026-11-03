package gg.overlab.backend.collector;

import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.collector.run.CollectorRunDto;
import gg.overlab.backend.collector.run.CollectorRunRepository;
import gg.overlab.backend.collector.run.CollectorTrigger;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Collector (admin)")
@RestController
@RequestMapping("/api/admin/collector")
@RequiredArgsConstructor
public class CollectorAdminController {

    private final RatesCollectorService collectorService;
    private final CollectorRunRepository runRepository;
    private final AuditService auditService;
    private final PerkImportService perkImportService;
    private final PatchImportService patchImportService;

    @Operation(summary = "List collector jobs with cron schedule and enabled flag")
    @GetMapping("/jobs")
    public List<CollectorJobDto> jobs() {
        return collectorService.jobs().stream()
                .map(job -> new CollectorJobDto(job.name(), job.cron(), job.enabled()))
                .toList();
    }

    @Operation(summary = "List recent collector runs")
    @GetMapping("/runs")
    public List<CollectorRunDto> runs() {
        return runRepository.findTop50ByOrderByStartedAtDesc().stream().map(CollectorRunDto::from).toList();
    }

    @Operation(summary = "Run a collector job now")
    @PostMapping("/jobs/{name}/run")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public CollectorRunDto run(@PathVariable String name) {
        CollectorRunDto run = collectorService.startAsync(name, CollectorTrigger.MANUAL);
        auditService.logCreate("CollectorRun", run.id(), run);
        return run;
    }

    @Operation(summary = "Import perks from the Blizzard hero pages in the background")
    @PostMapping("/perks/import")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public PerkImportStartedDto importPerks() {
        return new PerkImportStartedDto(perkImportService.startAsync());
    }

    @Operation(summary = "Import new balance patches from the Blizzard patch notes page")
    @PostMapping("/patches/import")
    public PatchImportResultDto importPatches() {
        return new PatchImportResultDto(patchImportService.importNew());
    }

    public record PatchImportResultDto(int created) {
    }

    public record PerkImportStartedDto(int heroes) {
    }

    public record CollectorJobDto(String name, String cron, boolean enabled) {
    }
}
