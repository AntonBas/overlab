package gg.overlab.backend.hero.ability;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HeroAbilityRepository extends JpaRepository<HeroAbility, Long> {

    @EntityGraph(attributePaths = "hero")
    boolean existsByHeroId(Long heroId);

    List<HeroAbility> findAllByOrderByHeroNameAscSortOrderAsc();

    @EntityGraph(attributePaths = "hero")
    List<HeroAbility> findAllByHeroSlugOrderBySortOrderAsc(String heroSlug);

    Optional<HeroAbility> findByHeroIdAndSlug(Long heroId, String slug);
}
