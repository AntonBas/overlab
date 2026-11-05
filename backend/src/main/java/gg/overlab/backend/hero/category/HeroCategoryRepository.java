package gg.overlab.backend.hero.category;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HeroCategoryRepository extends JpaRepository<HeroCategory, Long> {

    @EntityGraph(attributePaths = "heroes")
    List<HeroCategory> findAllByOrderByNameAsc();

    Optional<HeroCategory> findBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
