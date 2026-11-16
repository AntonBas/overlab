package gg.overlab.backend.audit;

import gg.overlab.backend.audit.dto.AuditLogDto;
import gg.overlab.backend.common.PageResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditQueryService {

    private static final int MAX_PAGE_SIZE = 100;

    private final AuditLogRepository repository;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(readOnly = true)
    public PageResponse<AuditLogDto> search(String entityType, Long actorId, AuditAction action, Instant from,
                                            Instant to, int page, int size) {
        Specification<AuditLog> specification = (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (entityType != null) {
                predicates.add(builder.equal(root.get("entityType"), entityType));
            }
            if (actorId != null) {
                predicates.add(builder.equal(root.get("actorId"), actorId));
            }
            if (action != null) {
                predicates.add(builder.equal(root.get("action"), action));
            }
            if (from != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("occurredAt"), from));
            }
            if (to != null) {
                predicates.add(builder.lessThan(root.get("occurredAt"), to));
            }
            return builder.and(predicates.toArray(new Predicate[0]));
        };
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, "occurredAt", "id"));
        Page<AuditLog> logs = repository.findAll(specification, pageable);
        Map<Long, String> actorNames = actorNames(logs.getContent());
        return PageResponse.of(logs.map(log -> AuditLogDto.from(log, actorNames)));
    }

    private Map<Long, String> actorNames(List<AuditLog> logs) {
        List<Long> actorIds = logs.stream().map(AuditLog::getActorId).filter(Objects::nonNull).distinct().toList();
        if (actorIds.isEmpty()) {
            return Map.of();
        }
        List<?> rows = entityManager.createNativeQuery("select id, display_name from users where id in (:ids)")
                .setParameter("ids", actorIds)
                .getResultList();
        Map<Long, String> names = new HashMap<>();
        for (Object row : rows) {
            Object[] columns = (Object[]) row;
            names.put(((Number) columns[0]).longValue(), (String) columns[1]);
        }
        return names;
    }
}
