package gg.overlab.backend.config.cache;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import org.junit.jupiter.api.Test;

class RedisCircuitBreakerTest {

    @Test
    void startsClosed() {
        assertThat(new RedisCircuitBreaker().isOpen()).isFalse();
    }

    @Test
    void opensAfterAFailureAndClosesOnSuccess() {
        RedisCircuitBreaker breaker = new RedisCircuitBreaker();

        breaker.recordFailure();
        assertThat(breaker.isOpen()).isTrue();

        breaker.recordSuccess();
        assertThat(breaker.isOpen()).isFalse();
    }

    @Test
    void closesByItselfAfterTheOpenPeriod() {
        RedisCircuitBreaker breaker = new RedisCircuitBreaker(Duration.ofMillis(-1));

        breaker.recordFailure();

        assertThat(breaker.isOpen()).isFalse();
    }
}
