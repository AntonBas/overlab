package gg.overlab.backend.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import gg.overlab.backend.config.security.AuthProperties;
import gg.overlab.backend.config.security.AuthenticatedUser;
import gg.overlab.backend.config.security.JwtTokenProvider;
import java.time.Duration;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class JwtTokenProviderTest {

    private final MockEnvironment environment = new MockEnvironment();
    private final JwtTokenProvider provider = new JwtTokenProvider(AuthFixtures.properties(), environment);

    @Test
    void parsesTokenItCreated() {
        User user = AuthFixtures.user(7, "ana@overlab.gg", UserRole.ADMIN, true);

        Optional<AuthenticatedUser> parsed = provider.parse(provider.createAccessToken(user));

        assertThat(parsed).contains(new AuthenticatedUser(7L, "ana@overlab.gg", UserRole.ADMIN));
    }

    @Test
    void rejectsTamperedToken() {
        String token = provider.createAccessToken(AuthFixtures.user(1, "a@overlab.gg", UserRole.USER, true));

        assertThat(provider.parse(token + "x")).isEmpty();
        assertThat(provider.parse("not-a-token")).isEmpty();
    }

    @Test
    void rejectsTokenSignedWithAnotherKey() {
        JwtTokenProvider other = new JwtTokenProvider(withSecret("fedcba9876543210fedcba9876543210"), environment);
        String token = other.createAccessToken(AuthFixtures.user(1, "a@overlab.gg", UserRole.USER, true));

        assertThat(provider.parse(token)).isEmpty();
    }

    @Test
    void rejectsExpiredToken() {
        AuthProperties expired = new AuthProperties(AuthFixtures.SECRET, Duration.ofSeconds(-5), Duration.ofDays(1),
                Duration.ofHours(1), Duration.ofHours(1), false, null, null, null, 10);
        String token = new JwtTokenProvider(expired, environment)
                .createAccessToken(AuthFixtures.user(1, "a@overlab.gg", UserRole.USER, true));

        assertThat(provider.parse(token)).isEmpty();
    }

    @Test
    void rejectsShortSecret() {
        assertThatThrownBy(() -> new JwtTokenProvider(withSecret("short"), environment))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void prodProfileRequiresSecret() {
        MockEnvironment prod = new MockEnvironment();
        prod.setActiveProfiles("prod");

        assertThatThrownBy(() -> new JwtTokenProvider(withSecret(""), prod)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void localProfileFallsBackToRandomSecret() {
        JwtTokenProvider randomKey = new JwtTokenProvider(withSecret(""), environment);
        String token = randomKey.createAccessToken(AuthFixtures.user(3, "r@overlab.gg", UserRole.USER, true));

        assertThat(randomKey.parse(token)).isPresent();
        assertThat(provider.parse(token)).isEmpty();
    }

    private AuthProperties withSecret(String secret) {
        return new AuthProperties(secret, Duration.ofMinutes(15), Duration.ofDays(14), Duration.ofHours(24),
                Duration.ofHours(1), false, null, null, null, 10);
    }
}
