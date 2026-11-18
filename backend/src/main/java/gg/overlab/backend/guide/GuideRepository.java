package gg.overlab.backend.guide;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GuideRepository extends JpaRepository<Guide, Long> {

    @EntityGraph(attributePaths = {"hero", "map"})
    List<Guide> findAllByPublishedTrueOrderBySortOrderAscIdAsc();

    @EntityGraph(attributePaths = {"hero", "map"})
    List<Guide> findAllByHeroSlugAndPublishedTrueOrderBySortOrderAscIdAsc(String heroSlug);

    @EntityGraph(attributePaths = {"hero", "map"})
    List<Guide> findAllByMapSlugAndPublishedTrueOrderBySortOrderAscIdAsc(String mapSlug);

    @EntityGraph(attributePaths = {"hero", "map"})
    List<Guide> findAllByHeroSlugAndMapSlugAndPublishedTrueOrderBySortOrderAscIdAsc(String heroSlug, String mapSlug);

    @EntityGraph(attributePaths = {"hero", "map"})
    List<Guide> findAllByOrderByIdAsc();

    @EntityGraph(attributePaths = {"hero", "map"})
    Optional<Guide> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"hero", "map"})
    Optional<Guide> findWithDetailsBySlug(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}
