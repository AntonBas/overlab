package gg.overlab.backend.config.cache;

import java.util.Collection;
import java.util.concurrent.Callable;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Supplier;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

public class AfterCommitEvictionCacheManager implements CacheManager {

    private final CacheManager delegate;
    private final Supplier<RedisCircuitBreaker> breaker;

    public AfterCommitEvictionCacheManager(CacheManager delegate) {
        this(delegate, fixed(new RedisCircuitBreaker()));
    }

    public AfterCommitEvictionCacheManager(CacheManager delegate, Supplier<RedisCircuitBreaker> breaker) {
        this.delegate = delegate;
        this.breaker = breaker;
    }

    private static Supplier<RedisCircuitBreaker> fixed(RedisCircuitBreaker breaker) {
        return () -> breaker;
    }

    @Override
    public Cache getCache(String name) {
        Cache cache = delegate.getCache(name);
        return cache == null ? null : new AfterCommitEvictionCache(cache, breaker.get());
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
        private final RedisCircuitBreaker breaker;

        private AfterCommitEvictionCache(Cache delegate, RedisCircuitBreaker breaker) {
            this.delegate = delegate;
            this.breaker = breaker;
        }

        private <T> T guarded(Supplier<T> call, T whenOpen) {
            if (breaker.isOpen()) {
                return whenOpen;
            }
            try {
                T result = call.get();
                breaker.recordSuccess();
                return result;
            } catch (RuntimeException exception) {
                breaker.recordFailure();
                throw exception;
            }
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
            return guarded(() -> delegate.get(key), null);
        }

        @Override
        public <T> T get(Object key, Class<T> type) {
            return guarded(() -> delegate.get(key, type), null);
        }

        @Override
        public <T> T get(Object key, Callable<T> valueLoader) {
            if (breaker.isOpen()) {
                try {
                    return valueLoader.call();
                } catch (Exception exception) {
                    throw new ValueRetrievalException(key, valueLoader, exception);
                }
            }
            AtomicBoolean loaderFailed = new AtomicBoolean();
            Callable<T> trackedLoader = () -> {
                try {
                    return valueLoader.call();
                } catch (Exception exception) {
                    loaderFailed.set(true);
                    throw exception;
                }
            };
            try {
                T result = delegate.get(key, trackedLoader);
                breaker.recordSuccess();
                return result;
            } catch (RuntimeException exception) {
                if (!loaderFailed.get()) {
                    breaker.recordFailure();
                }
                throw exception;
            }
        }

        @Override
        public CompletableFuture<?> retrieve(Object key) {
            return guarded(() -> delegate.retrieve(key), CompletableFuture.completedFuture(null));
        }

        @Override
        public <T> CompletableFuture<T> retrieve(Object key, Supplier<CompletableFuture<T>> valueLoader) {
            return delegate.retrieve(key, valueLoader);
        }

        @Override
        public void put(Object key, Object value) {
            guarded(() -> {
                delegate.put(key, value);
                return null;
            }, null);
        }

        @Override
        public ValueWrapper putIfAbsent(Object key, Object value) {
            return guarded(() -> delegate.putIfAbsent(key, value), null);
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
