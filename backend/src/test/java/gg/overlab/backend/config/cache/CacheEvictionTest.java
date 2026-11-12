package gg.overlab.backend.config.cache;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

class CacheEvictionTest {

    private final CacheManager cacheManager = mock(CacheManager.class);
    private final CacheEviction eviction = new CacheEviction(cacheManager);

    @Test
    void clearsEveryApplicationCache() {
        Cache[] caches = new Cache[CacheNames.ALL.size()];
        for (int index = 0; index < caches.length; index++) {
            caches[index] = mock(Cache.class);
            when(cacheManager.getCache(CacheNames.ALL.get(index))).thenReturn(caches[index]);
        }

        eviction.evictAll();

        for (Cache cache : caches) {
            verify(cache).clear();
        }
    }

    @Test
    void keepsClearingTheOtherCachesWhenOneIsUnavailable() {
        Cache broken = mock(Cache.class);
        Cache healthy = mock(Cache.class);
        doThrow(new IllegalStateException("redis down")).when(broken).clear();
        when(cacheManager.getCache(CacheNames.CONTENT)).thenReturn(broken);
        when(cacheManager.getCache(CacheNames.HEROES)).thenReturn(healthy);

        eviction.evictAll();

        verify(healthy).clear();
    }
}
