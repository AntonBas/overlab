package gg.overlab.backend.feedback;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SiteFeedbackRepository extends JpaRepository<SiteFeedback, Long> {

    long countByUserIdAndStatus(Long userId, FeedbackStatus status);

    List<SiteFeedback> findAllByUserIdOrderByIdAsc(Long userId);

    List<SiteFeedback> findByStatusOrderByCreatedAtDesc(FeedbackStatus status, Pageable pageable);
}
