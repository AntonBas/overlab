package gg.overlab.backend.user.token;

import java.time.Instant;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserTokenRepository extends JpaRepository<UserToken, Long> {

    @Query("select t from UserToken t join fetch t.user where t.tokenHash = :hash and t.type = :type")
    Optional<UserToken> findByHashAndType(@Param("hash") String hash, @Param("type") UserTokenType type);

    @Query("select t from UserToken t join fetch t.user where t.tokenHash = :hash and t.type in :types")
    Optional<UserToken> findByHashAndTypeIn(@Param("hash") String hash,
                                            @Param("types") Collection<UserTokenType> types);

    @Modifying
    @Query("delete from UserToken t where t.user.id = :userId and t.type = :type")
    void deleteAllByUserAndType(@Param("userId") Long userId, @Param("type") UserTokenType type);

    @Modifying
    @Query("delete from UserToken t where t.tokenHash = :hash and t.type = :type")
    void deleteByHashAndType(@Param("hash") String hash, @Param("type") UserTokenType type);

    @Modifying
    @Query("delete from UserToken t where t.expiresAt < :threshold")
    int deleteExpiredBefore(@Param("threshold") Instant threshold);
}
