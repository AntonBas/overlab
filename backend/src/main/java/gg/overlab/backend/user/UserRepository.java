package gg.overlab.backend.user;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    long countByRole(UserRole role);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.role = :role and u.enabled = true")
    List<User> lockEnabledByRole(@Param("role") UserRole role);

    Page<User> findByEmailContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(String email, String displayName,
                                                                                Pageable pageable);

    Optional<User> findByGoogleSubject(String googleSubject);
}
