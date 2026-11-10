package gg.overlab.backend.config.cache;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

class ContentCacheResetTest {

    private final CacheManager cacheManager = mock(CacheManager.class);
    private final Cache cache = mock(Cache.class);
    private final ContentCacheReset reset = new ContentCacheReset(cacheManager);

    @Test
    void clearsTheContentCacheOnStartup() {
        when(cacheManager.getCache(CacheNames.CONTENT)).thenReturn(cache);

        reset.clearContentCache();

        verify(cache).clear();
    }

    @Test
    void startupContinuesWhenTheCacheIsUnavailable() {
        when(cacheManager.getCache(CacheNames.CONTENT)).thenReturn(cache);
        doThrow(new IllegalStateException("redis down")).when(cache).clear();

        reset.clearContentCache();
    }
}
