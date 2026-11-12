package gg.overlab.backend.feedback;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SiteFeedbackRepository extends JpaRepository<SiteFeedback, Long> {

    long countByUserIdAndStatus(Long userId, FeedbackStatus status);

    List<SiteFeedback> findAllByUserIdOrderByIdAsc(Long userId);

    @Modifying
    @Query("update SiteFeedback f set f.contactName = null, f.contactEmail = null where f.userId = :userId")
    int clearContactDetails(@Param("userId") Long userId);

    List<SiteFeedback> findByStatusOrderByCreatedAtDesc(FeedbackStatus status, Pageable pageable);
}
