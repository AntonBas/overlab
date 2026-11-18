package gg.overlab.backend.common;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
public class UserScopedLock {

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(propagation = Propagation.MANDATORY)
    public void acquire(String scope, Long userId) {
        if (userId == null) {
            return;
        }
        entityManager.createNativeQuery("select pg_advisory_xact_lock(hashtext(:scope), :userId)")
                .setParameter("scope", scope)
                .setParameter("userId", Math.toIntExact(userId % Integer.MAX_VALUE))
                .getSingleResult();
    }
}
