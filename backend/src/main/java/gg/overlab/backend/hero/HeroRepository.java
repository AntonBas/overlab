package gg.overlab.backend.hero;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HeroRepository extends JpaRepository<Hero, Long> {

    Optional<Hero> findBySlug(String slug);

    Optional<Hero> findBySlugAndActiveTrue(String slug);

    List<Hero> findAllByActiveTrueOrderByNameAsc();

    List<Hero> findAllBySlugIn(Collection<String> slugs);
}
