package gg.overlab.backend.config.cache;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;

class FallbackCacheErrorHandlerTest {

    private final FallbackCacheErrorHandler handler = new FallbackCacheErrorHandler();
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
    void evictAndClearFailuresAreNotHidden() {
        assertThatThrownBy(() -> handler.handleCacheEvictError(failure, cache, "key")).isSameAs(failure);
        assertThatThrownBy(() -> handler.handleCacheClearError(failure, cache)).isSameAs(failure);
    }
}
