package gg.overlab.backend.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.user.account.AdminUserService;
import gg.overlab.backend.user.token.UserTokenService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AdminUserServiceTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final UserTokenService tokenService = mock(UserTokenService.class);
    private final AuditService auditService = mock(AuditService.class);
    private final AdminUserService service = new AdminUserService(userRepository, tokenService, auditService);

    private User actor;
    private User otherAdmin;

    @BeforeEach
    void setUp() {
        actor = AuthFixtures.user(1, "actor@overlab.test", UserRole.ADMIN, true);
        otherAdmin = AuthFixtures.user(2, "other@overlab.test", UserRole.ADMIN, true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(actor));
        when(userRepository.findById(2L)).thenReturn(Optional.of(otherAdmin));
    }

    @Test
    void administratorCannotChangeOrBlockTheirOwnAccount() {
        assertThatThrownBy(() -> service.setRole(1L, 1L, UserRole.USER))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("own role");
        assertThatThrownBy(() -> service.setEnabled(1L, 1L, false))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("own account");
    }

    @Test
    void lastActiveAdministratorCannotBeDemotedEvenByAStaleSession() {
        when(userRepository.lockEnabledByRole(UserRole.ADMIN)).thenReturn(List.of(otherAdmin));

        assertThatThrownBy(() -> service.setRole(2L, 1L, UserRole.USER))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("At least one active administrator");
        assertThat(otherAdmin.getRole()).isEqualTo(UserRole.ADMIN);
        verify(tokenService, never()).revokeAll(any(), any());
    }

    @Test
    void lastActiveAdministratorCannotBeBlocked() {
        when(userRepository.lockEnabledByRole(UserRole.ADMIN)).thenReturn(List.of(otherAdmin));

        assertThatThrownBy(() -> service.setEnabled(2L, 1L, false))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("At least one active administrator");
        assertThat(otherAdmin.isEnabled()).isTrue();
    }

    @Test
    void anAdministratorCanBeDemotedAndBlockedWhileAnotherActiveOneRemains() {
        when(userRepository.lockEnabledByRole(UserRole.ADMIN)).thenReturn(List.of(actor, otherAdmin));

        service.setRole(2L, 1L, UserRole.USER);
        assertThat(otherAdmin.getRole()).isEqualTo(UserRole.USER);

        otherAdmin.setRole(UserRole.ADMIN);
        service.setEnabled(2L, 1L, false);
        assertThat(otherAdmin.isEnabled()).isFalse();
    }
}
