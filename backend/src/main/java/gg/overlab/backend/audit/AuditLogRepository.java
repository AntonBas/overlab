package gg.overlab.backend.audit;

import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long>, JpaSpecificationExecutor<AuditLog> {

    @Modifying
    @Query("update AuditLog a set a.actorId = null, a.ipAddress = null where a.actorId = :userId")
    int anonymizeActor(@Param("userId") Long userId);

    @Modifying
    @Query("update AuditLog a set a.entityId = null, a.ipAddress = null "
            + "where a.entityType = 'User' and a.entityId = :userId")
    int anonymizeUserEntity(@Param("userId") String userId);

    @Modifying
    @Query("delete from AuditLog a where a.entityType = :entityType and a.occurredAt < :threshold")
    int deleteByEntityTypeBefore(@Param("entityType") String entityType, @Param("threshold") Instant threshold);
}
