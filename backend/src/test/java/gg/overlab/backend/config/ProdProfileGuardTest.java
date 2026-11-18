package gg.overlab.backend.config;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class ProdProfileGuardTest {

    @Test
    void acceptsAnHttpsAddress() {
        assertThatCode(() -> new ProdProfileGuard("https://overlabgg.com").requireSecureAddress())
                .doesNotThrowAnyException();
    }

    @Test
    void acceptsALocalHttpAddressForTheLocalDockerStack() {
        assertThatCode(() -> new ProdProfileGuard("http://localhost:5173").requireSecureAddress())
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsAPublicHttpAddress() {
        assertThatThrownBy(() -> new ProdProfileGuard("http://overlabgg.com").requireSecureAddress())
                .isInstanceOf(IllegalStateException.class);
    }
}
