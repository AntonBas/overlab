package gg.overlab.backend.hero.perk;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PerkRepository extends JpaRepository<Perk, Long> {

    @EntityGraph(attributePaths = "hero")
    List<Perk> findAllByHeroSlugOrderBySlotAscNameAsc(String heroSlug);

    Optional<Perk> findByHeroIdAndNameIgnoreCase(Long heroId, String name);

    boolean existsByHeroIdAndNameIgnoreCase(Long heroId, String name);

    boolean existsByHeroIdAndNameIgnoreCaseAndIdNot(Long heroId, String name, Long id);
}
