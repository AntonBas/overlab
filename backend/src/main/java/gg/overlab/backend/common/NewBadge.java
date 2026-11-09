package gg.overlab.backend.common;

import java.time.Duration;
import java.time.Instant;

public final class NewBadge {

    public static final Duration WINDOW = Duration.ofDays(14);

    private NewBadge() {
    }

    public static boolean isRecent(Instant introducedAt) {
        return isRecent(introducedAt, Instant.now());
    }

    public static boolean isRecent(Instant introducedAt, Instant now) {
        return introducedAt != null && introducedAt.plus(WINDOW).isAfter(now);
    }
}
