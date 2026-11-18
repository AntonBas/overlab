package gg.overlab.backend.config.cache;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicLong;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class RedisCircuitBreaker {

    private static final Duration OPEN_FOR = Duration.ofSeconds(30);

    private final AtomicLong openUntilNanos = new AtomicLong();
    private final Duration openFor;

    public RedisCircuitBreaker() {
        this(OPEN_FOR);
    }

    RedisCircuitBreaker(Duration openFor) {
        this.openFor = openFor;
    }

    public boolean isOpen() {
        return System.nanoTime() - openUntilNanos.get() < 0;
    }

    public void recordFailure() {
        long until = System.nanoTime() + openFor.toNanos();
        boolean wasOpen = isOpen();
        openUntilNanos.set(until);
        if (!wasOpen) {
            log.warn("Redis is unavailable, it is skipped for {} seconds", openFor.toSeconds());
        }
    }

    public void recordSuccess() {
        if (openUntilNanos.getAndSet(0) != 0) {
            log.info("Redis is available again");
        }
    }
}
