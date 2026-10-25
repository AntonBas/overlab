package gg.overlab.backend.collector.run;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CollectorRunRepository extends JpaRepository<CollectorRun, Long> {

    List<CollectorRun> findTop50ByOrderByStartedAtDesc();
}
