package gg.overlab.backend.user.token;

import gg.overlab.backend.exception.core.InvalidTokenException;
import gg.overlab.backend.user.User;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Collection;
import java.util.HexFormat;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Issues and consumes single-use tokens. Only a hash of each token is stored. Presenting a used refresh token
 * again after a 30 second grace period (parallel browser requests are normal) is treated as theft and revokes
 * every refresh token of that user.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserTokenService {

    private static final int TOKEN_BYTES = 32;
    private static final Duration REUSE_GRACE = Duration.ofSeconds(30);

    private final UserTokenRepository tokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public String issue(User user, UserTokenType type, Duration ttl) {
        byte[] bytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        UserToken token = new UserToken();
        token.setUser(user);
        token.setType(type);
        token.setTokenHash(hash(rawToken));
        token.setExpiresAt(Instant.now().plus(ttl));
        tokenRepository.save(token);
        return rawToken;
    }

    @Transactional(noRollbackFor = InvalidTokenException.class)
    public User consume(String rawToken, UserTokenType type) {
        return consumeAny(rawToken, List.of(type)).user();
    }

    @Transactional(noRollbackFor = InvalidTokenException.class)
    public ConsumedToken consumeAny(String rawToken, Collection<UserTokenType> types) {
        UserToken token = tokenRepository.findByHashAndTypeIn(hash(rawToken), types)
                .orElseThrow(InvalidTokenException::new);
        Instant now = Instant.now();
        if (token.getUsedAt() != null) {
            revokeSessionsOnReuse(token, now);
            throw new InvalidTokenException();
        }
        if (token.getExpiresAt().isBefore(now)) {
            throw new InvalidTokenException();
        }
        if (tokenRepository.markUsed(token.getId(), now) == 0) {
            throw new InvalidTokenException();
        }
        token.setUsedAt(now);
        return new ConsumedToken(token.getUser(), token.getType());
    }

    private void revokeSessionsOnReuse(UserToken token, Instant now) {
        if (token.getType() == UserTokenType.REFRESH && token.getUsedAt().isBefore(now.minus(REUSE_GRACE))) {
            log.warn("A used refresh token was presented again, revoking all sessions of user {}",
                    token.getUser().getId());
            tokenRepository.deleteAllByUserAndType(token.getUser().getId(), UserTokenType.REFRESH);
        }
    }

    @Transactional
    public void revoke(String rawToken, UserTokenType type) {
        tokenRepository.deleteByHashAndType(hash(rawToken), type);
    }

    @Transactional
    public void revokeAll(User user, UserTokenType type) {
        tokenRepository.deleteAllByUserAndType(user.getId(), type);
    }

    @Scheduled(cron = "0 15 3 * * *")
    @Transactional
    public void deleteExpired() {
        tokenRepository.deleteExpiredBefore(Instant.now().minus(Duration.ofDays(1)));
    }

    private String hash(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
