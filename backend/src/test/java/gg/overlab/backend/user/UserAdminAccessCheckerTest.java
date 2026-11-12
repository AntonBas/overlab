package gg.overlab.backend.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import gg.overlab.backend.config.security.UserRole;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class UserAdminAccessCheckerTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final UserAdminAccessChecker checker = new UserAdminAccessChecker(userRepository);

    @Test
    void anEnabledAdministratorHasAccess() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(UserRole.ADMIN, true)));

        assertThat(checker.isActiveAdmin(1L)).isTrue();
    }

    @Test
    void aDisabledAdministratorHasNoAccess() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(UserRole.ADMIN, false)));

        assertThat(checker.isActiveAdmin(1L)).isFalse();
    }

    @Test
    void aDemotedOrDeletedAdministratorHasNoAccess() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(UserRole.USER, true)));
        when(userRepository.findById(2L)).thenReturn(Optional.empty());

        assertThat(checker.isActiveAdmin(1L)).isFalse();
        assertThat(checker.isActiveAdmin(2L)).isFalse();
    }

    private User user(UserRole role, boolean enabled) {
        User user = new User();
        user.setRole(role);
        user.setEnabled(enabled);
        return user;
    }
}
