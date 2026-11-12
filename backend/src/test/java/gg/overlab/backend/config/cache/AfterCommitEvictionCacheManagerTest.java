package gg.overlab.backend.config.cache;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.cache.Cache;
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
}
