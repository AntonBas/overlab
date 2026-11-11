package gg.overlab.backend.collector.dto;

import gg.overlab.backend.collector.run.CollectorRun;
import gg.overlab.backend.collector.run.CollectorRunStatus;
import gg.overlab.backend.collector.run.CollectorTrigger;
import java.time.Instant;

public record CollectorRunDto(
        Long id,
        String jobName,
        CollectorTrigger trigger,
        CollectorRunStatus status,
        Instant startedAt,
        Instant finishedAt,
        int requestsTotal,
        int requestsFailed,
        int rowsSaved,
        String errorSummary) {

    public static CollectorRunDto from(CollectorRun run) {
        return new CollectorRunDto(run.getId(), run.getJobName(), run.getTrigger(), run.getStatus(),
                run.getStartedAt(), run.getFinishedAt(), run.getRequestsTotal(), run.getRequestsFailed(),
                run.getRowsSaved(), run.getErrorSummary());
    }
}
