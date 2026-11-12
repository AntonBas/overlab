package gg.overlab.backend.config.security;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Component;

/**
 * Fixed-window counter kept in Redis by an atomic script, so a key never stays without an expiry. If Redis is
 * unavailable the counter falls back to a per-instance in-memory window instead of switching limits off.
 */
@Slf4j
@Component
public class RateLimitCounter {

    private static final int FALLBACK_CLEANUP_THRESHOLD = 10_000;
    private static final RedisScript<Long> INCREMENT_SCRIPT = new DefaultRedisScript<>("""
            local count = redis.call('INCR', KEYS[1])
            if count == 1 or redis.call('PTTL', KEYS[1]) < 0 then
                redis.call('PEXPIRE', KEYS[1], ARGV[1])
            end
            return count
            """, Long.class);

    private final StringRedisTemplate redisTemplate;
    private final Map<String, Window> fallbackWindows = new ConcurrentHashMap<>();

    public RateLimitCounter(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public long increment(String key, Duration window) {
        try {
            Long count = redisTemplate.execute(INCREMENT_SCRIPT, List.of(key), String.valueOf(window.toMillis()));
            if (count != null) {
                return count;
            }
        } catch (RuntimeException exception) {
            log.warn("Redis rate limit counter unavailable, using the local counter: {}", exception.getMessage());
        }
        return incrementLocally(key, window);
    }

    public long current(String key) {
        try {
            String value = redisTemplate.opsForValue().get(key);
            if (value != null) {
                return Long.parseLong(value);
            }
        } catch (RuntimeException exception) {
            log.warn("Redis rate limit counter unavailable, using the local counter: {}", exception.getMessage());
        }
        Window window = fallbackWindows.get(key);
        return window == null || window.expiresAt().isBefore(Instant.now()) ? 0 : window.count();
    }

    public void reset(String key) {
        fallbackWindows.remove(key);
        try {
            redisTemplate.delete(key);
        } catch (RuntimeException exception) {
            log.warn("Redis rate limit counter could not be reset: {}", exception.getMessage());
        }
    }

    private long incrementLocally(String key, Duration window) {
        Instant now = Instant.now();
        if (fallbackWindows.size() > FALLBACK_CLEANUP_THRESHOLD) {
            fallbackWindows.values().removeIf(entry -> entry.expiresAt().isBefore(now));
        }
        return fallbackWindows.compute(key, (name, existing) -> existing == null || existing.expiresAt().isBefore(now)
                ? new Window(now.plus(window), 1)
                : new Window(existing.expiresAt(), existing.count() + 1)).count();
    }

    private record Window(Instant expiresAt, long count) {
    }
}
