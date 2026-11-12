package gg.overlab.backend.common;

import java.time.Duration;

public final class Pause {

    private Pause() {
    }

    public static boolean sleep(Duration delay) {
        try {
            Thread.sleep(delay);
            return true;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return false;
        }
    }
}
