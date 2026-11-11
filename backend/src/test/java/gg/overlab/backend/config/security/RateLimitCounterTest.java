package gg.overlab.backend.config.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.data.redis.core.script.RedisScript;

@SuppressWarnings({"unchecked", "rawtypes"})
class RateLimitCounterTest {

    private final StringRedisTemplate redisTemplate = mock(StringRedisTemplate.class);
    private final RateLimitCounter counter = new RateLimitCounter(redisTemplate);

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
}
