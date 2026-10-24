package gg.overlab.backend.gamemap;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameMapRepository extends JpaRepository<GameMap, Long> {

    Optional<GameMap> findBySlug(String slug);
}
