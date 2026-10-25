package gg.overlab.backend.hero.relation;

import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HeroRelationRepository extends JpaRepository<HeroRelation, Long> {

    @EntityGraph(attributePaths = {"hero", "relatedHero"})
    List<HeroRelation> findAllByHeroSlugAndType(String heroSlug, RelationType type);

    @EntityGraph(attributePaths = {"hero", "relatedHero"})
    List<HeroRelation> findAllByRelatedHeroSlugAndType(String heroSlug, RelationType type);

    @EntityGraph(attributePaths = {"hero", "relatedHero"})
    List<HeroRelation> findAllByHeroSlugOrRelatedHeroSlugOrderByIdAsc(String heroSlug, String relatedHeroSlug);

    @EntityGraph(attributePaths = {"hero", "relatedHero"})
    List<HeroRelation> findAllByOrderByIdAsc();

    boolean existsByHeroIdAndRelatedHeroIdAndTypeAndIdNot(Long heroId, Long relatedHeroId, RelationType type, Long id);
}
