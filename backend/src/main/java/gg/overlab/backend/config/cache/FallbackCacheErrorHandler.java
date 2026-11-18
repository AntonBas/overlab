package gg.overlab.backend.config.cache;

import io.micrometer.core.instrument.MeterRegistry;
import java.util.function.Supplier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.interceptor.CacheErrorHandler;

@Slf4j
class FallbackCacheErrorHandler implements CacheErrorHandler {

    private final Supplier<MeterRegistry> registry;

    FallbackCacheErrorHandler(Supplier<MeterRegistry> registry) {
        this.registry = registry;
    }

    @Override
    public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
        countFailure(cache, "read");
        log.warn("Cache '{}' is unavailable for reading, using the database: {}", cache.getName(),
                exception.getMessage());
    }

    @Override
    public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
        countFailure(cache, "write");
        log.warn("Cache '{}' is unavailable for writing: {}", cache.getName(), exception.getMessage());
    }

    @Override
    public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
        throw exception;
    }

    @Override
    public void handleCacheClearError(RuntimeException exception, Cache cache) {
        throw exception;
    }

    private void countFailure(Cache cache, String operation) {
        MeterRegistry meterRegistry = registry.get();
        if (meterRegistry != null) {
            meterRegistry.counter("cache.fallback", "cache", cache.getName(), "operation", operation).increment();
        }
    }
}
