package gg.overlab.backend.user.auth;

import gg.overlab.backend.config.security.RateLimitCounter;
import gg.overlab.backend.exception.core.TooManyRequestsException;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Counts failed sign-ins per email and client address, so a stranger cannot lock the real owner out from another
 * address. A much higher limit per email alone still stops a distributed guessing attack.
 */
@Component
@RequiredArgsConstructor
public class LoginAttemptLimiter {

    private static final int MAX_FAILURES_PER_ADDRESS = 10;
    private static final int MAX_FAILURES_PER_EMAIL = 50;
    private static final Duration WINDOW = Duration.ofMinutes(15);
    private static final String KEY_PREFIX = "overlab:login-failures:";
    private static final Duration MAIL_COOLDOWN = Duration.ofMinutes(1);
    private static final Duration MAIL_HOURLY_WINDOW = Duration.ofHours(1);
    private static final int MAX_MAILS_PER_EMAIL_PER_HOUR = 10;
    private static final String MAIL_KEY_PREFIX = "overlab:mail-cooldown:";
    private static final String UNKNOWN_ADDRESS = "unknown";

    private final RateLimitCounter counter;

    public void requireAllowed(String normalizedEmail) {
        if (counter.current(addressKey(normalizedEmail)) >= MAX_FAILURES_PER_ADDRESS
                || counter.current(emailKey(normalizedEmail)) >= MAX_FAILURES_PER_EMAIL) {
            throw new TooManyRequestsException("Too many failed sign-in attempts, try again later");
        }
    }

    public void recordFailure(String normalizedEmail) {
        counter.increment(addressKey(normalizedEmail), WINDOW);
        counter.increment(emailKey(normalizedEmail), WINDOW);
    }

    public boolean isMailThrottled(String purpose, String normalizedEmail) {
        boolean addressCooldown = counter.increment(
                MAIL_KEY_PREFIX + purpose + ":" + hash(normalizedEmail + "|" + clientAddress()), MAIL_COOLDOWN) > 1;
        if (addressCooldown) {
            return true;
        }
        String hourlyKey = MAIL_KEY_PREFIX + purpose + ":hourly:" + hash(normalizedEmail);
        if (counter.current(hourlyKey) >= MAX_MAILS_PER_EMAIL_PER_HOUR) {
            return true;
        }
        counter.increment(hourlyKey, MAIL_HOURLY_WINDOW);
        return false;
    }

    public void reset(String normalizedEmail) {
        counter.reset(addressKey(normalizedEmail));
        counter.reset(emailKey(normalizedEmail));
    }

    private String addressKey(String normalizedEmail) {
        return KEY_PREFIX + hash(normalizedEmail + "|" + clientAddress());
    }

    private String emailKey(String normalizedEmail) {
        return KEY_PREFIX + hash(normalizedEmail);
    }

    private String clientAddress() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            HttpServletRequest request = attributes.getRequest();
            return request.getRemoteAddr();
        }
        return UNKNOWN_ADDRESS;
    }

    private String hash(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
