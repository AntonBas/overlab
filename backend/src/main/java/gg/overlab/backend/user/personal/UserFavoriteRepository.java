package gg.overlab.backend.user.personal;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserFavoriteRepository extends JpaRepository<UserFavorite, Long> {

    @Query("select f from UserFavorite f join fetch f.hero h where f.userId = :userId order by h.name")
    List<UserFavorite> findHeroFavorites(@Param("userId") Long userId);

    @Query("select f from UserFavorite f join fetch f.map m where f.userId = :userId order by m.name")
    List<UserFavorite> findMapFavorites(@Param("userId") Long userId);

    long countByUserIdAndHeroIsNotNull(Long userId);

    long countByUserIdAndMapIsNotNull(Long userId);

    boolean existsByUserIdAndHeroSlug(Long userId, String heroSlug);

    boolean existsByUserIdAndMapSlug(Long userId, String mapSlug);

    @Modifying
    void deleteByUserIdAndHeroSlug(Long userId, String heroSlug);

    @Modifying
    void deleteByUserIdAndMapSlug(Long userId, String mapSlug);
}
