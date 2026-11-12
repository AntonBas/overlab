package gg.overlab.backend.user;

import gg.overlab.backend.config.security.AuthProperties;
import gg.overlab.backend.config.security.UserRole;
import java.time.Duration;

public final class AuthFixtures {

    public static final String SECRET = "0123456789abcdef0123456789abcdef";

    private AuthFixtures() {
    }

    public static AuthProperties properties() {
        return new AuthProperties(SECRET, Duration.ofMinutes(15), Duration.ofDays(14), Duration.ofHours(24),
                Duration.ofHours(1), false, "noreply@overlab.gg", null, null, 10);
    }

    public static User user(long id, String email, UserRole role, boolean verified) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setDisplayName("Tester");
        user.setRole(role);
        user.setEmailVerified(verified);
        return user;
    }
}
