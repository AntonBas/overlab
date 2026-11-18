package gg.overlab.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import gg.overlab.backend.common.ScheduledJobLock;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

@IntegrationTest
class ScheduledJobLockIntegrationTest {

    @Autowired
    private ScheduledJobLock jobLock;

    @Test
    void runsTheJobAndReturnsItsResult() {
        String name = "test-" + UUID.randomUUID();

        assertThat(jobLock.callExclusively(name, () -> 7)).contains(7);
        assertThat(jobLock.runExclusively(name, () -> { })).isTrue();
    }

    @Test
    void skipsTheJobWhileAnotherRunHoldsTheSameName() throws Exception {
        String name = "test-" + UUID.randomUUID();
        CountDownLatch started = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        CompletableFuture<Boolean> holder = CompletableFuture.supplyAsync(() -> jobLock.runExclusively(name, () -> {
            started.countDown();
            awaitUninterruptibly(release);
        }));
        assertThat(started.await(10, TimeUnit.SECONDS)).isTrue();
        AtomicBoolean ranWhileHeld = new AtomicBoolean();

        boolean ran = jobLock.runExclusively(name, () -> ranWhileHeld.set(true));
        boolean otherNameRan = jobLock.runExclusively(name + "-other", () -> { });
        release.countDown();

        assertThat(ran).isFalse();
        assertThat(ranWhileHeld).isFalse();
        assertThat(otherNameRan).isTrue();
        assertThat(holder.get(10, TimeUnit.SECONDS)).isTrue();
        assertThat(jobLock.runExclusively(name, () -> { })).isTrue();
    }

    @Test
    void releasesTheLockWhenTheJobFails() {
        String name = "test-" + UUID.randomUUID();

        assertThatThrownBy(() -> jobLock.runExclusively(name, () -> {
            throw new IllegalArgumentException("job failed");
        })).isInstanceOf(IllegalArgumentException.class);

        assertThat(jobLock.runExclusively(name, () -> { })).isTrue();
    }

    private static void awaitUninterruptibly(CountDownLatch latch) {
        try {
            latch.await(10, TimeUnit.SECONDS);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        }
    }
}
