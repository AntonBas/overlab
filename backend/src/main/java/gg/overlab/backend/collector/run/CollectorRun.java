package gg.overlab.backend.collector.run;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "collector_runs")
public class CollectorRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_name", nullable = false, length = 64)
    private String jobName;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false, length = 16)
    private CollectorTrigger trigger;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CollectorRunStatus status;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    @Column(name = "requests_total", nullable = false)
    private int requestsTotal;

    @Column(name = "requests_failed", nullable = false)
    private int requestsFailed;

    @Column(name = "rows_saved", nullable = false)
    private int rowsSaved;

    @Column(name = "error_summary", columnDefinition = "text")
    private String errorSummary;
}
