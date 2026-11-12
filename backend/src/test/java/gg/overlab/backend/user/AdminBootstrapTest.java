package gg.overlab.backend.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.config.security.AuthProperties;
import gg.overlab.backend.config.security.UserRole;
import gg.overlab.backend.user.auth.AdminBootstrap;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

class AdminBootstrapTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);

    private void run(AuthProperties properties) {
        new AdminBootstrap(properties, userRepository, passwordEncoder).run(new DefaultApplicationArguments());
    }

    @Test
    void createsAVerifiedAdministratorFromTheConfiguredCredentials() {
        run(AuthFixtures.propertiesWithAdmin("  Admin@Overlab.gg ", "long-enough-password"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        User admin = saved.getValue();
        assertThat(admin.getEmail()).isEqualTo("admin@overlab.gg");
        assertThat(admin.getRole()).isEqualTo(UserRole.ADMIN);
        assertThat(admin.isEmailVerified()).isTrue();
        assertThat(passwordEncoder.matches("long-enough-password", admin.getPasswordHash())).isTrue();
    }

    @Test
    void doesNothingWithoutCredentials() {
        run(AuthFixtures.propertiesWithAdmin("", ""));
        run(AuthFixtures.propertiesWithAdmin("admin@overlab.gg", null));

        verify(userRepository, never()).save(any());
    }

    @Test
    void refusesAShortPassword() {
        run(AuthFixtures.propertiesWithAdmin("admin@overlab.gg", "short"));

        verify(userRepository, never()).save(any());
    }

    @Test
    void keepsAnExistingAccount() {
        when(userRepository.existsByEmailIgnoreCase("admin@overlab.gg")).thenReturn(true);

        run(AuthFixtures.propertiesWithAdmin("admin@overlab.gg", "long-enough-password"));

        verify(userRepository, never()).save(any());
    }
}
