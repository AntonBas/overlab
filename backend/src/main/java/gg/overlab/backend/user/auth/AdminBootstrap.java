package gg.overlab.backend.user.auth;

import gg.overlab.backend.config.security.AuthProperties;
import gg.overlab.backend.user.AuthProvider;
import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRepository;
import gg.overlab.backend.user.UserRole;
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
        String email = properties.adminEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) {
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
        log.info("Admin account created for {}", email);
    }
}
