package gg.overlab.backend.config.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import gg.overlab.backend.config.cache.RedisCircuitBreaker;
import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.script.RedisScript;

@SuppressWarnings({"unchecked", "rawtypes"})
class RateLimitCounterTest {

    private final StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
    private final RateLimitCounter counter = new RateLimitCounter(redisTemplate, new RedisCircuitBreaker());

    @Test
    void usesTheRedisScriptResultWhenRedisIsAvailable() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(String.class))).thenReturn(4L);

        assertThat(counter.increment("key", Duration.ofMinutes(1))).isEqualTo(4L);
    }

    @Test
    void countsLocallyWhenRedisIsDown() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(String.class)))
                .thenThrow(new RedisConnectionFailureException("down"));

        assertThat(counter.increment("key", Duration.ofMinutes(1))).isEqualTo(1L);
        assertThat(counter.increment("key", Duration.ofMinutes(1))).isEqualTo(2L);
        assertThat(counter.increment("other", Duration.ofMinutes(1))).isEqualTo(1L);
    }

    @Test
    void skipsRedisWhileTheBreakerIsOpen() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(String.class)))
                .thenThrow(new RedisConnectionFailureException("down"));

        counter.increment("key", Duration.ofMinutes(1));
        counter.increment("key", Duration.ofMinutes(1));
        counter.increment("key", Duration.ofMinutes(1));

        verify(redisTemplate, times(1)).execute(any(RedisScript.class), anyList(), any(String.class));
    }

    @Test
    void localWindowExpires() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(String.class)))
                .thenThrow(new RedisConnectionFailureException("down"));

        counter.increment("key", Duration.ofMillis(-1));

        assertThat(counter.increment("key", Duration.ofMinutes(1))).isEqualTo(1L);
    }

    @Test
    void currentReadsRedisAndFallsBackLocally() {
        ValueOperations<String, String> operations = mock(ValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(operations);
        when(operations.get("key")).thenReturn("7");
        assertThat(counter.current("key")).isEqualTo(7L);

        when(operations.get("local")).thenThrow(new RedisConnectionFailureException("down"));
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(String.class)))
                .thenThrow(new RedisConnectionFailureException("down"));
        counter.increment("local", Duration.ofMinutes(1));
        assertThat(counter.current("local")).isEqualTo(1L);
    }

    @Test
    void resetClearsLocalAndRedisCounters() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(String.class)))
                .thenThrow(new RedisConnectionFailureException("down"));
        counter.increment("key", Duration.ofMinutes(1));
        when(redisTemplate.delete("key")).thenThrow(new RedisConnectionFailureException("down"));

        counter.reset("key");

        assertThat(counter.increment("key", Duration.ofMinutes(1))).isEqualTo(1L);
    }

    @Test
    void slidingCounterUsesTheRedisScriptResult() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(String.class), any(String.class)))
                .thenReturn(9L);

        assertThat(counter.incrementSliding("key", Duration.ofMinutes(1))).isEqualTo(9L);
    }

    @Test
    void slidingCounterWeighsThePreviousWindowByTheTimeLeftInTheCurrentOne() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(String.class), any(String.class)))
                .thenThrow(new RedisConnectionFailureException("down"));
        Duration window = Duration.ofMinutes(1);
        Instant windowStart = Instant.ofEpochMilli(60_000L * 1000);
        for (int request = 1; request <= 10; request++) {
            assertThat(counter.incrementSliding("key", window, windowStart.plusSeconds(request))).isEqualTo(request);
        }

        assertThat(counter.incrementSliding("key", window, windowStart.plusSeconds(60 + 30))).isEqualTo(1 + 5);
        assertThat(counter.incrementSliding("key", window, windowStart.plusSeconds(60 + 45))).isEqualTo(2 + 2);
        assertThat(counter.incrementSliding("key", window, windowStart.plusMillis(60_000 + 59_999))).isEqualTo(3);
    }

    @Test
    void slidingCounterForgetsWindowsOlderThanThePreviousOne() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(String.class), any(String.class)))
                .thenThrow(new RedisConnectionFailureException("down"));
        Duration window = Duration.ofMinutes(1);
        Instant windowStart = Instant.ofEpochMilli(60_000L * 1000);
        counter.incrementSliding("key", window, windowStart);
        counter.incrementSliding("key", window, windowStart);

        assertThat(counter.incrementSliding("key", window, windowStart.plus(Duration.ofMinutes(2)))).isEqualTo(1);
    }

    @Test
    void resetAlsoClearsTheSlidingCounter() {
        when(redisTemplate.execute(any(RedisScript.class), anyList(), any(String.class), any(String.class)))
                .thenThrow(new RedisConnectionFailureException("down"));
        counter.incrementSliding("key", Duration.ofMinutes(1));
        counter.incrementSliding("key", Duration.ofMinutes(1));

        counter.reset("key");

        assertThat(counter.incrementSliding("key", Duration.ofMinutes(1))).isEqualTo(1);
    }
}
