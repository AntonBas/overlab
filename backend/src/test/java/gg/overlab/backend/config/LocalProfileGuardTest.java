package gg.overlab.backend.config;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class LocalProfileGuardTest {

    @Test
    void acceptsALocalAddress() {
        assertThatCode(() -> new LocalProfileGuard("http://localhost:5173").rejectProductionAddress())
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsAnHttpsAddress() {
        assertThatThrownBy(() -> new LocalProfileGuard("https://overlabgg.com").rejectProductionAddress())
                .isInstanceOf(IllegalStateException.class);
    }
}
