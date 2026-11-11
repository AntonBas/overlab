package gg.overlab.backend.user.auth;

import gg.overlab.backend.config.security.RateLimitCounter;
import gg.overlab.backend.exception.core.TooManyRequestsException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class LoginAttemptLimiter {

    private static final int MAX_FAILURES = 10;
    private static final Duration WINDOW = Duration.ofMinutes(15);
    private static final String KEY_PREFIX = "overlab:login-failures:";

    private final RateLimitCounter counter;

    public void requireAllowed(String normalizedEmail) {
        if (counter.current(key(normalizedEmail)) >= MAX_FAILURES) {
            throw new TooManyRequestsException("Too many failed sign-in attempts, try again later");
        }
    }

    public void recordFailure(String normalizedEmail) {
        counter.increment(key(normalizedEmail), WINDOW);
    }

    public void reset(String normalizedEmail) {
        counter.reset(key(normalizedEmail));
    }

    private String key(String normalizedEmail) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(normalizedEmail.getBytes(StandardCharsets.UTF_8));
            return KEY_PREFIX + HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
