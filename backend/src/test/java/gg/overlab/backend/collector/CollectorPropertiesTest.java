package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.RankTier;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Test;

class CollectorPropertiesTest {

    private CollectorJob scheduled(String name) {
        return CollectorFixtures.job(name, List.of(GameQueue.COMPETITIVE), List.of(RankTier.ALL), List.of("all-maps"));
    }

    private CollectorJob chained(String name, String after) {
        return CollectorFixtures.chainedJob(name, after, Duration.ofDays(1));
    }

    @Test
    void acceptsChainsThatEndAtAScheduledJob() {
        CollectorProperties properties = CollectorFixtures.properties(1, scheduled("daily"), chained("maps", "daily"),
                chained("ranks", "maps"));

        assertThat(properties.isChainValid()).isTrue();
    }

    @Test
    void rejectsAJobThatFollowsItself() {
        assertThat(CollectorFixtures.properties(1, scheduled("daily"), chained("loop", "loop")).isChainValid())
                .isFalse();
    }

    @Test
    void rejectsJobsThatFollowEachOther() {
        CollectorProperties properties = CollectorFixtures.properties(1, scheduled("daily"), chained("a", "b"),
                chained("b", "a"));

        assertThat(properties.isChainValid()).isFalse();
    }

    @Test
    void rejectsAJobThatFollowsAnUnknownJob() {
        assertThat(CollectorFixtures.properties(1, scheduled("daily"), chained("orphan", "missing")).isChainValid())
                .isFalse();
    }
}
