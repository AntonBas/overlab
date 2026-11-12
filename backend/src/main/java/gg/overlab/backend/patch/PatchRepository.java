package gg.overlab.backend.patch;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatchRepository extends JpaRepository<Patch, Long> {

    List<Patch> findAllByOrderByReleasedAtDesc();

    Optional<Patch> findBySlug(String slug);

    Optional<Patch> findFirstByReleasedAtLessThanEqualOrderByReleasedAtDesc(Instant moment);

    Optional<Patch> findFirstByReleasedAtGreaterThanOrderByReleasedAtAsc(Instant moment);

    boolean existsByVersionIgnoreCase(String version);

    boolean existsByVersionIgnoreCaseAndIdNot(String version, Long id);

    long countByReleasedAt(Instant releasedAt);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
