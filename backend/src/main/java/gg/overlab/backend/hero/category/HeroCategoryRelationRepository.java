package gg.overlab.backend.hero.category;

import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HeroCategoryRelationRepository extends JpaRepository<HeroCategoryRelation, Long> {

    @EntityGraph(attributePaths = {"hero", "category"})
    List<HeroCategoryRelation> findAllByOrderByIdAsc();

    boolean existsByHeroIdAndCategoryId(Long heroId, Long categoryId);

    boolean existsByHeroIdAndCategoryIdAndIdNot(Long heroId, Long categoryId, Long id);
}
