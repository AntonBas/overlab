package gg.overlab.backend.config.cache;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;

class FallbackCacheErrorHandlerTest {

    private final SimpleMeterRegistry registry = new SimpleMeterRegistry();
    private final FallbackCacheErrorHandler handler = new FallbackCacheErrorHandler(() -> registry);
    private final Cache cache = mock(Cache.class);
    private final RuntimeException failure = new IllegalStateException("redis down");

    FallbackCacheErrorHandlerTest() {
        when(cache.getName()).thenReturn("content");
    }

    @Test
    void readAndWriteFailuresFallBackToTheDatabase() {
        assertThatCode(() -> handler.handleCacheGetError(failure, cache, "key")).doesNotThrowAnyException();
        assertThatCode(() -> handler.handleCachePutError(failure, cache, "key", "value")).doesNotThrowAnyException();
    }

    @Test
    void fallbacksAreCounted() {
        handler.handleCacheGetError(failure, cache, "key");
        handler.handleCachePutError(failure, cache, "key", "value");

        assertThat(registry.counter("cache.fallback", "cache", "content", "operation", "read").count()).isEqualTo(1);
        assertThat(registry.counter("cache.fallback", "cache", "content", "operation", "write").count()).isEqualTo(1);
    }

    @Test
    void evictAndClearFailuresAreNotHidden() {
        assertThatThrownBy(() -> handler.handleCacheEvictError(failure, cache, "key")).isSameAs(failure);
        assertThatThrownBy(() -> handler.handleCacheClearError(failure, cache)).isSameAs(failure);
    }
}
