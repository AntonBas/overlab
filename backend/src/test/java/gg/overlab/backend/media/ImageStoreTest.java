package gg.overlab.backend.media;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

class ImageStoreTest {

    private final MediaStorage storage = mock(MediaStorage.class);
    private final ImageStore store = new ImageStore(storage);

    @AfterEach
    void clearSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void removesTheFileImmediatelyOutsideATransaction() {
        store.remove("perks/old.webp");

        verify(storage).delete("perks/old.webp");
    }

    @Test
    void removesTheFileOnlyAfterTheTransactionCommits() {
        TransactionSynchronizationManager.initSynchronization();

        store.remove("perks/old.webp");

        verify(storage, never()).delete("perks/old.webp");
        TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
        verify(storage).delete("perks/old.webp");
    }

    @Test
    void keepsTheFileWhenTheTransactionRollsBack() {
        TransactionSynchronizationManager.initSynchronization();

        store.remove("perks/old.webp");
        TransactionSynchronizationManager.getSynchronizations().forEach(
                synchronization -> synchronization.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));

        verify(storage, never()).delete("perks/old.webp");
    }

    @Test
    void ignoresExternalAndMissingPaths() {
        store.remove(null);
        store.remove("https://example.com/a.png");
        store.remove("/static/a.png");

        verify(storage, never()).delete(anyString());
    }
}
