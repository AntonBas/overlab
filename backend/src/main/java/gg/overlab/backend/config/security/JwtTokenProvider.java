package gg.overlab.backend.config.security;

import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Slf4j
@Component
public class JwtTokenProvider {

    private static final int MINIMUM_SECRET_BYTES = 32;

    private final AuthProperties properties;
    private final SecretKey signingKey;

    public JwtTokenProvider(AuthProperties properties, Environment environment) {
        this.properties = properties;
        this.signingKey = Keys.hmacShaKeyFor(resolveSecret(properties.jwtSecret(), environment));
    }

    public String createAccessToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("email", user.getEmail())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(properties.accessTokenTtl())))
                .signWith(signingKey)
                .compact();
    }

    public Optional<AuthenticatedUser> parse(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).getPayload();
            return Optional.of(new AuthenticatedUser(
                    Long.valueOf(claims.getSubject()),
                    claims.get("email", String.class),
                    UserRole.valueOf(claims.get("role", String.class))));
        } catch (JwtException | IllegalArgumentException exception) {
            return Optional.empty();
        }
    }

    private byte[] resolveSecret(String configuredSecret, Environment environment) {
        if (StringUtils.hasText(configuredSecret)) {
            byte[] secret = configuredSecret.getBytes(StandardCharsets.UTF_8);
            if (secret.length < MINIMUM_SECRET_BYTES) {
                throw new IllegalStateException("app.auth.jwt-secret must be at least 32 bytes long");
            }
            return secret;
        }
        if (environment.acceptsProfiles(Profiles.of("prod"))) {
            throw new IllegalStateException("JWT_SECRET must be set in the prod profile");
        }
        log.warn("JWT_SECRET is not set, using a random key; sessions will not survive a restart");
        byte[] randomSecret = new byte[MINIMUM_SECRET_BYTES];
        new SecureRandom().nextBytes(randomSecret);
        return randomSecret;
    }
}
