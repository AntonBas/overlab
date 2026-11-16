package gg.overlab.backend.config.security;

import gg.overlab.backend.config.cache.RedisCircuitBreaker;
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
 * Counters kept in Redis by atomic scripts, so a key never stays without an expiry. {@link #increment} is a fixed
 * window; {@link #incrementSliding} estimates the requests of the last full window from the current and the
 * previous fixed window, so a client cannot send a double burst around a window boundary. If Redis is unavailable
 * both fall back to per-instance in-memory counters instead of switching limits off.
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
    private static final RedisScript<Long> SLIDING_INCREMENT_SCRIPT = new DefaultRedisScript<>("""
            local window = tonumber(ARGV[1])
            local elapsed = tonumber(ARGV[2])
            local current = redis.call('INCR', KEYS[1])
            if current == 1 or redis.call('PTTL', KEYS[1]) < 0 then
                redis.call('PEXPIRE', KEYS[1], window * 2)
            end
            local previous = tonumber(redis.call('GET', KEYS[2]) or '0')
            return current + math.floor(previous * (window - elapsed) / window)
            """, Long.class);

    private final StringRedisTemplate redisTemplate;
    private final Map<String, Window> fallbackWindows = new ConcurrentHashMap<>();
    private final Map<String, SlidingWindow> fallbackSlidingWindows = new ConcurrentHashMap<>();

    private final RedisCircuitBreaker breaker;

    public RateLimitCounter(StringRedisTemplate redisTemplate, RedisCircuitBreaker breaker) {
        this.redisTemplate = redisTemplate;
        this.breaker = breaker;
    }

    public long increment(String key, Duration window) {
        if (!breaker.isOpen()) {
            try {
                Long count = redisTemplate.execute(INCREMENT_SCRIPT, List.of(key), String.valueOf(window.toMillis()));
                if (count != null) {
                    breaker.recordSuccess();
                    return count;
                }
            } catch (RuntimeException exception) {
                breaker.recordFailure();
                log.debug("Redis rate limit counter unavailable, using the local counter: {}", exception.getMessage());
            }
        }
        return incrementLocally(key, window);
    }

    public long incrementSliding(String key, Duration window) {
        return incrementSliding(key, window, Instant.now());
    }

    public long incrementSliding(String key, Duration window, Instant now) {
        long windowMillis = window.toMillis();
        long index = now.toEpochMilli() / windowMillis;
        long elapsed = now.toEpochMilli() % windowMillis;
        if (!breaker.isOpen()) {
            try {
                Long estimate = redisTemplate.execute(SLIDING_INCREMENT_SCRIPT,
                        List.of(key + ":" + index, key + ":" + (index - 1)), String.valueOf(windowMillis),
                        String.valueOf(elapsed));
                if (estimate != null) {
                    breaker.recordSuccess();
                    return estimate;
                }
            } catch (RuntimeException exception) {
                breaker.recordFailure();
                log.debug("Redis rate limit counter unavailable, using the local counter: {}", exception.getMessage());
            }
        }
        return incrementSlidingLocally(key, index, elapsed, windowMillis);
    }

    public long current(String key) {
        if (!breaker.isOpen()) {
            try {
                String value = redisTemplate.opsForValue().get(key);
                breaker.recordSuccess();
                if (value != null) {
                    return Long.parseLong(value);
                }
            } catch (RuntimeException exception) {
                breaker.recordFailure();
                log.debug("Redis rate limit counter unavailable, using the local counter: {}", exception.getMessage());
            }
        }
        Window window = fallbackWindows.get(key);
        return window == null || window.expiresAt().isBefore(Instant.now()) ? 0 : window.count();
    }

    public void reset(String key) {
        fallbackWindows.remove(key);
        fallbackSlidingWindows.remove(key);
        if (breaker.isOpen()) {
            return;
        }
        try {
            redisTemplate.delete(key);
        } catch (RuntimeException exception) {
            breaker.recordFailure();
            log.debug("Redis rate limit counter could not be reset: {}", exception.getMessage());
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

    private long incrementSlidingLocally(String key, long index, long elapsed, long windowMillis) {
        if (fallbackSlidingWindows.size() > FALLBACK_CLEANUP_THRESHOLD) {
            fallbackSlidingWindows.values().removeIf(entry -> entry.index() < index - 1);
        }
        SlidingWindow updated = fallbackSlidingWindows.compute(key, (name, existing) -> {
            if (existing == null || existing.index() < index - 1) {
                return new SlidingWindow(index, 1, 0);
            }
            if (existing.index() == index) {
                return new SlidingWindow(index, existing.count() + 1, existing.previousCount());
            }
            return new SlidingWindow(index, 1, existing.count());
        });
        return updated.count() + updated.previousCount() * (windowMillis - elapsed) / windowMillis;
    }

    private record Window(Instant expiresAt, long count) {
    }

    private record SlidingWindow(long index, long count, long previousCount) {
    }
}
