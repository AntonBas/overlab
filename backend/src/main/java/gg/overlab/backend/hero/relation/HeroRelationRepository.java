package gg.overlab.backend.hero.relation;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HeroRelationRepository extends JpaRepository<HeroRelation, Long> {

    @EntityGraph(attributePaths = {"hero", "relatedHero"})
    List<HeroRelation> findAllByHeroSlugAndType(String heroSlug, RelationType type);

    @EntityGraph(attributePaths = {"hero", "relatedHero"})
    List<HeroRelation> findAllByRelatedHeroSlugAndType(String heroSlug, RelationType type);

    @EntityGraph(attributePaths = {"hero", "relatedHero"})
    List<HeroRelation> findAllByHeroSlugOrRelatedHeroSlugOrderByIdAsc(String heroSlug, String relatedHeroSlug);

    @EntityGraph(attributePaths = {"hero", "relatedHero"})
    List<HeroRelation> findAllByOrderByIdAsc();

    boolean existsByHeroIdAndRelatedHeroIdAndType(Long heroId, Long relatedHeroId, RelationType type);

    boolean existsByHeroIdAndRelatedHeroIdAndTypeAndIdNot(Long heroId, Long relatedHeroId, RelationType type, Long id);

    @EntityGraph(attributePaths = {"hero", "relatedHero"})
    @Query("""
            select r from HeroRelation r
            where r.type = :type
              and ((r.hero.slug = :firstSlug and r.relatedHero.slug = :secondSlug)
                or (r.hero.slug = :secondSlug and r.relatedHero.slug = :firstSlug))
            """)
    Optional<HeroRelation> findBetween(@Param("firstSlug") String firstSlug, @Param("secondSlug") String secondSlug,
                                       @Param("type") RelationType type);
}
