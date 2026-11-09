package gg.overlab.backend.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class NewBadgeTest {

    private static final Instant NOW = Instant.parse("2026-11-20T12:00:00Z");

    @Test
    void isRecentForTwoWeeksAfterTheFirstAppearance() {
        assertThat(NewBadge.isRecent(NOW.minus(Duration.ofDays(13)), NOW)).isTrue();
        assertThat(NewBadge.isRecent(NOW.minus(Duration.ofDays(15)), NOW)).isFalse();
    }

    @Test
    void isNeverRecentWithoutAnIntroductionDate() {
        assertThat(NewBadge.isRecent(null, NOW)).isFalse();
    }
}
