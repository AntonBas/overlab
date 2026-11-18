package gg.overlab.backend.config.cache;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.concurrent.Callable;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

class AfterCommitEvictionCacheManagerTest {

    private final AfterCommitEvictionCacheManager manager =
            new AfterCommitEvictionCacheManager(new ConcurrentMapCacheManager("content"));

    @AfterEach
    void endSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void evictsImmediatelyOutsideATransaction() {
        Cache cache = manager.getCache("content");
        cache.put("key", "value");

        cache.clear();

        assertThat(cache.get("key")).isNull();
    }

    @Test
    void keepsTheEntryUntilTheTransactionCommits() {
        Cache cache = manager.getCache("content");
        cache.put("key", "value");
        TransactionSynchronizationManager.initSynchronization();

        cache.clear();

        assertThat(cache.get("key")).isNotNull();
        TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
        assertThat(cache.get("key")).isNull();
    }

    @Test
    void neverEvictsWhenTheTransactionRollsBack() {
        Cache cache = manager.getCache("content");
        cache.put("key", "value");
        TransactionSynchronizationManager.initSynchronization();

        cache.evict("key");
        TransactionSynchronizationManager.getSynchronizations()
                .forEach(sync -> sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));

        assertThat(cache.get("key")).isNotNull();
    }

    @Test
    void failingCacheOpensTheBreakerAndLaterReadsAreMisses() {
        RedisCircuitBreaker breaker = new RedisCircuitBreaker();
        Cache failing = mock(Cache.class);
        when(failing.get("key")).thenThrow(new IllegalStateException("redis down"));
        CacheManager delegate = mock(CacheManager.class);
        when(delegate.getCache("content")).thenReturn(failing);
        Cache cache = new AfterCommitEvictionCacheManager(delegate, () -> breaker).getCache("content");

        assertThatThrownBy(() -> cache.get("key"))
                .isInstanceOf(IllegalStateException.class);

        assertThat(breaker.isOpen()).isTrue();
        assertThat(cache.get("key")).isNull();
        cache.put("key", "value");
        verify(failing, times(1)).get("key");
        verify(failing, never()).put("key", "value");
    }

    @Test
    void loaderIsCalledDirectlyWhileTheBreakerIsOpen() {
        RedisCircuitBreaker breaker = new RedisCircuitBreaker();
        breaker.recordFailure();
        Cache cache = new AfterCommitEvictionCacheManager(new ConcurrentMapCacheManager("content"),
                () -> breaker).getCache("content");

        assertThat(cache.get("key", () -> "loaded")).isEqualTo("loaded");
    }

    @Test
    void failureOfTheLoaderDoesNotOpenTheBreaker() {
        RedisCircuitBreaker breaker = new RedisCircuitBreaker();
        Cache cache = new AfterCommitEvictionCacheManager(new ConcurrentMapCacheManager("content"),
                () -> breaker).getCache("content");

        assertThatThrownBy(() -> cache.get("key", () -> {
            throw new IllegalArgumentException("unknown hero");
        })).hasRootCauseInstanceOf(IllegalArgumentException.class);

        assertThat(breaker.isOpen()).isFalse();
    }

    @Test
    void failureOfTheCacheWhileLoadingOpensTheBreaker() {
        RedisCircuitBreaker breaker = new RedisCircuitBreaker();
        Cache failing = mock(Cache.class);
        when(failing.get(eq("key"), ArgumentMatchers.<Callable<String>>any()))
                .thenThrow(new IllegalStateException("redis down"));
        CacheManager delegate = mock(CacheManager.class);
        when(delegate.getCache("content")).thenReturn(failing);
        Cache cache = new AfterCommitEvictionCacheManager(delegate, () -> breaker).getCache("content");

        assertThatThrownBy(() -> cache.get("key", () -> "loaded")).isInstanceOf(IllegalStateException.class);

        assertThat(breaker.isOpen()).isTrue();
    }
}
