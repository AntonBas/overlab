package gg.overlab.backend.config.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import org.junit.jupiter.api.Test;

class AuthPropertiesTest {

    private AuthProperties properties(int rateLimitPerMinute) {
        return new AuthProperties("secret", Duration.ofMinutes(15), Duration.ofDays(14), Duration.ofHours(24),
                Duration.ofHours(1), true, null, null, null, rateLimitPerMinute);
    }

    @Test
    void missingRateLimitFallsBackToTenPerMinute() {
        assertThat(properties(0).rateLimitPerMinute()).isEqualTo(10);
    }

    @Test
    void explicitRateLimitIsKept() {
        assertThat(properties(60).rateLimitPerMinute()).isEqualTo(60);
    }
}
