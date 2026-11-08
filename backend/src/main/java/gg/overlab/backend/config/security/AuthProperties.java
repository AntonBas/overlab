package gg.overlab.backend.config.security;

import jakarta.validation.constraints.NotNull;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.auth")
public record AuthProperties(
        String jwtSecret,
        @NotNull Duration accessTokenTtl,
        @NotNull Duration refreshTokenTtl,
        @NotNull Duration verificationTokenTtl,
        @NotNull Duration resetTokenTtl,
        boolean cookieSecure,
        String mailFrom,
        String adminEmail,
        String adminPassword,
        int rateLimitPerMinute) {

    private static final String DEFAULT_MAIL_FROM = "noreply@overlabgg.com";

    public AuthProperties {
        if (mailFrom == null || mailFrom.isBlank()) {
            mailFrom = DEFAULT_MAIL_FROM;
        }
    }
}
