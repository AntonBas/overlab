package gg.overlab.backend.user.personal;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserNoteRepository extends JpaRepository<UserNote, Long> {

    @Query("select n from UserNote n join fetch n.hero h where n.userId = :userId order by h.name")
    List<UserNote> findAllForUser(@Param("userId") Long userId);

    @Query("select n from UserNote n join fetch n.hero h where n.userId = :userId and h.slug = :heroSlug")
    Optional<UserNote> findForUserAndHero(@Param("userId") Long userId, @Param("heroSlug") String heroSlug);

    long countByUserId(Long userId);

    @Modifying
    void deleteByUserIdAndHeroSlug(Long userId, String heroSlug);
}
