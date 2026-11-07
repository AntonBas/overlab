package gg.overlab.backend.hero;

import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HeroRoleChangeRepository extends JpaRepository<HeroRoleChange, Long> {

    List<HeroRoleChange> findAllByChangedAtGreaterThanAndChangedAtLessThanEqualOrderByChangedAtDesc(
            Instant after, Instant until);
}
