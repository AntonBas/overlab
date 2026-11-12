package gg.overlab.backend.hero.ability;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HeroAbilityRepository extends JpaRepository<HeroAbility, Long> {

    boolean existsByHeroId(Long heroId);

    @EntityGraph(attributePaths = "hero")
    List<HeroAbility> findAllByHeroActiveTrueOrderByHeroNameAscSortOrderAsc();

    @EntityGraph(attributePaths = "hero")
    List<HeroAbility> findAllByHeroSlugOrderBySortOrderAsc(String heroSlug);

    Optional<HeroAbility> findByHeroIdAndSlug(Long heroId, String slug);
}
