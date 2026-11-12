package gg.overlab.backend.integration;

import org.springframework.cache.CacheManager;

final class CacheTestSupport {

    private CacheTestSupport() {
    }

    static void clearAll(CacheManager cacheManager) {
        Thread worker = new Thread(() -> cacheManager.getCacheNames().forEach(name -> cacheManager.getCache(name).clear()));
        worker.start();
        try {
            worker.join();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        }
    }
}
