package gg.overlab.backend.config.cache;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CacheEviction {

    private final CacheManager cacheManager;

    @EventListener(ApplicationReadyEvent.class)
    public void evictOnStartup() {
        evictAll();
    }

    public void evictAll() {
        for (String cacheName : CacheNames.ALL) {
            try {
                Cache cache = cacheManager.getCache(cacheName);
                if (cache != null) {
                    cache.clear();
                }
            } catch (RuntimeException exception) {
                log.warn("Could not clear the cache '{}': {}", cacheName, exception.getMessage());
            }
        }
    }
}
