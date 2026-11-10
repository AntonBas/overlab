package gg.overlab.backend.config.cache;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ContentCacheReset {

    private final CacheManager cacheManager;

    public ContentCacheReset(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void clearContentCache() {
        try {
            Cache cache = cacheManager.getCache(CacheNames.CONTENT);
            if (cache != null) {
                cache.clear();
            }
        } catch (RuntimeException exception) {
            log.warn("Could not clear the content cache on startup: {}", exception.getMessage());
        }
    }
}
