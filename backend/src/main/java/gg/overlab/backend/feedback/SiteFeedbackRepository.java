package gg.overlab.backend.feedback;

import gg.overlab.backend.feedback.dto.FeedbackAdminDto;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SiteFeedbackRepository extends JpaRepository<SiteFeedback, Long> {

    long countByUserIdAndStatus(Long userId, FeedbackStatus status);

    List<SiteFeedback> findAllByUserIdOrderByIdAsc(Long userId);

    @Query("""
            select new gg.overlab.backend.feedback.dto.FeedbackAdminDto(
                f.id, f.type, f.message, f.pagePath, u.displayName, f.status, f.createdAt, f.resolvedAt)
            from SiteFeedback f
            left join gg.overlab.backend.user.User u on u.id = f.userId
            where f.status = :status
            order by f.createdAt desc
            """)
    List<FeedbackAdminDto> findForAdmin(@Param("status") FeedbackStatus status, Pageable pageable);
}
