package gg.overlab.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.config.security.RateLimitCounter;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;

@IntegrationTest
class RateLimitCounterIntegrationTest {

    @Autowired
    private RateLimitCounter counter;

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Test
    void incrementsAtomicallyAndAlwaysSetsAnExpiry() {
        String key = "overlab:test:" + UUID.randomUUID();

        assertThat(counter.increment(key, Duration.ofMinutes(1))).isEqualTo(1L);
        assertThat(counter.increment(key, Duration.ofMinutes(1))).isEqualTo(2L);

        assertThat(counter.current(key)).isEqualTo(2L);
        assertThat(redisTemplate.getExpire(key)).isPositive().isLessThanOrEqualTo(60L);
    }

    @Test
    void repairsCountersThatWereLeftWithoutAnExpiry() {
        String key = "overlab:test:" + UUID.randomUUID();
        redisTemplate.opsForValue().set(key, "5");
        assertThat(redisTemplate.getExpire(key)).isEqualTo(-1L);

        assertThat(counter.increment(key, Duration.ofMinutes(1))).isEqualTo(6L);

        assertThat(redisTemplate.getExpire(key)).isPositive();
    }

    @Test
    void resetRemovesTheCounter() {
        String key = "overlab:test:" + UUID.randomUUID();
        counter.increment(key, Duration.ofMinutes(1));

        counter.reset(key);

        assertThat(counter.current(key)).isZero();
        assertThat(counter.increment(key, Duration.ofMinutes(1))).isEqualTo(1L);
    }

    @Test
    void slidingCounterCarriesThePreviousWindowIntoTheNextOneAndExpires() {
        String key = "overlab:test:" + UUID.randomUUID();
        Duration window = Duration.ofMinutes(1);
        Instant windowStart = Instant.ofEpochMilli(60_000L * 1000);
        for (int request = 1; request <= 10; request++) {
            assertThat(counter.incrementSliding(key, window, windowStart.plusSeconds(request))).isEqualTo(request);
        }

        assertThat(counter.incrementSliding(key, window, windowStart.plusSeconds(60 + 30))).isEqualTo(1 + 5);
        assertThat(counter.incrementSliding(key, window, windowStart.plusSeconds(60 + 45))).isEqualTo(2 + 2);

        assertThat(redisTemplate.getExpire(key + ":1001")).isPositive().isLessThanOrEqualTo(120L);
    }
}
