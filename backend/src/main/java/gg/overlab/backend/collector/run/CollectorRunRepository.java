package gg.overlab.backend.collector.run;

import java.util.List;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface CollectorRunRepository extends JpaRepository<CollectorRun, Long> {

    List<CollectorRun> findTop50ByOrderByStartedAtDesc();

    Optional<CollectorRun> findFirstByJobNameAndStatusOrderByFinishedAtDesc(String jobName, CollectorRunStatus status);

    @Transactional
    @Modifying
    @Query("update CollectorRun run set run.status = :failed, run.finishedAt = :now, run.errorSummary = :summary "
            + "where run.status = :running")
    int failRunningRuns(@Param("running") CollectorRunStatus running, @Param("failed") CollectorRunStatus failed,
                        @Param("now") Instant now, @Param("summary") String summary);
}
