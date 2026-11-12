package gg.overlab.backend.config.cache;

import java.util.Collection;
import java.util.concurrent.Callable;
import java.util.concurrent.CompletableFuture;
import java.util.function.Supplier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

public class AfterCommitEvictionCacheManager implements CacheManager {

    private final CacheManager delegate;

    public AfterCommitEvictionCacheManager(CacheManager delegate) {
        this.delegate = delegate;
    }

    @Override
    public Cache getCache(String name) {
        Cache cache = delegate.getCache(name);
        return cache == null ? null : new AfterCommitEvictionCache(cache);
    }

    @Override
    public Collection<String> getCacheNames() {
        return delegate.getCacheNames();
    }

    @Override
    public void resetCaches() {
        delegate.resetCaches();
    }

    @Slf4j
    private static final class AfterCommitEvictionCache implements Cache {

        private final Cache delegate;

        private AfterCommitEvictionCache(Cache delegate) {
            this.delegate = delegate;
        }

        @Override
        public String getName() {
            return delegate.getName();
        }

        @Override
        public Object getNativeCache() {
            return delegate.getNativeCache();
        }

        @Override
        public ValueWrapper get(Object key) {
            return delegate.get(key);
        }

        @Override
        public <T> T get(Object key, Class<T> type) {
            return delegate.get(key, type);
        }

        @Override
        public <T> T get(Object key, Callable<T> valueLoader) {
            return delegate.get(key, valueLoader);
        }

        @Override
        public CompletableFuture<?> retrieve(Object key) {
            return delegate.retrieve(key);
        }

        @Override
        public <T> CompletableFuture<T> retrieve(Object key, Supplier<CompletableFuture<T>> valueLoader) {
            return delegate.retrieve(key, valueLoader);
        }

        @Override
        public void put(Object key, Object value) {
            delegate.put(key, value);
        }

        @Override
        public ValueWrapper putIfAbsent(Object key, Object value) {
            return delegate.putIfAbsent(key, value);
        }

        @Override
        public void evict(Object key) {
            afterCommit(() -> delegate.evict(key));
        }

        @Override
        public boolean evictIfPresent(Object key) {
            if (inTransaction()) {
                afterCommit(() -> delegate.evictIfPresent(key));
                return false;
            }
            return delegate.evictIfPresent(key);
        }

        @Override
        public void clear() {
            afterCommit(delegate::clear);
        }

        @Override
        public boolean invalidate() {
            if (inTransaction()) {
                afterCommit(delegate::invalidate);
                return false;
            }
            return delegate.invalidate();
        }

        private boolean inTransaction() {
            return TransactionSynchronizationManager.isSynchronizationActive();
        }

        private void afterCommit(Runnable eviction) {
            if (!inTransaction()) {
                eviction.run();
                return;
            }
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    try {
                        eviction.run();
                    } catch (RuntimeException exception) {
                        log.error("Cache '{}' could not be cleared after commit: {}", delegate.getName(),
                                exception.getMessage());
                    }
                }
            });
        }
    }
}
