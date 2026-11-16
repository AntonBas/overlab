package gg.overlab.backend.user.auth;

import gg.overlab.backend.config.security.AuthProperties;
import gg.overlab.backend.config.security.UserRole;
import gg.overlab.backend.user.AuthProvider;
import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRepository;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminBootstrap implements ApplicationRunner {

    private static final int MINIMUM_PASSWORD_LENGTH = 8;
    private static final int MAXIMUM_PASSWORD_BYTES = 72;

    private final AuthProperties properties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        if (!StringUtils.hasText(properties.adminEmail()) || !StringUtils.hasText(properties.adminPassword())) {
            return;
        }
        if (properties.adminPassword().length() < MINIMUM_PASSWORD_LENGTH) {
            log.warn("ADMIN_PASSWORD is shorter than {} characters, admin account was not created",
                    MINIMUM_PASSWORD_LENGTH);
            return;
        }
        if (properties.adminPassword().getBytes(StandardCharsets.UTF_8).length > MAXIMUM_PASSWORD_BYTES) {
            log.warn("ADMIN_PASSWORD is longer than {} bytes, admin account was not created",
                    MAXIMUM_PASSWORD_BYTES);
            return;
        }
        String email = properties.adminEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByRole(UserRole.ADMIN)) {
            return;
        }
        if (userRepository.existsByEmailIgnoreCase(email)) {
            log.warn("ADMIN_EMAIL is already registered as a regular user, admin account was not created");
            return;
        }
        User admin = new User();
        admin.setEmail(email);
        admin.setDisplayName("Admin");
        admin.setPasswordHash(passwordEncoder.encode(properties.adminPassword()));
        admin.setRole(UserRole.ADMIN);
        admin.setProvider(AuthProvider.LOCAL);
        admin.setEmailVerified(true);
        userRepository.save(admin);
        log.info("Admin account created");
    }
}
