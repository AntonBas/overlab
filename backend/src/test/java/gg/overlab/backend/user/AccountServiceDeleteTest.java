package gg.overlab.backend.user;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.audit.AuditLogRepository;
import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.config.security.UserRole;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.feedback.FeedbackService;
import gg.overlab.backend.notification.EmailService;
import gg.overlab.backend.user.account.AccountService;
import gg.overlab.backend.user.account.dto.DeleteAccountRequest;
import gg.overlab.backend.user.auth.LoginAttemptLimiter;
import gg.overlab.backend.user.token.UserTokenService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AccountServiceDeleteTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final AccountService service = new AccountService(userRepository, new UserMapper(),
            mock(PasswordEncoder.class), mock(UserTokenService.class), mock(EmailService.class),
            mock(LoginAttemptLimiter.class), AuthFixtures.properties(), mock(AuditService.class), mock(AuditLogRepository.class),
            mock(FeedbackService.class));

    private User admin(long id, boolean enabled) {
        User user = AuthFixtures.user(id, "admin" + id + "@overlab.gg", UserRole.ADMIN, true);
        user.setProvider(AuthProvider.GOOGLE);
        user.setEnabled(enabled);
        return user;
    }

    @Test
    void aLocalAccountWithoutAPasswordCanBeDeletedWithoutOne() {
        User linked = AuthFixtures.user(7, "linked@overlab.gg", UserRole.USER, true);
        linked.setProvider(AuthProvider.LOCAL);
        linked.setPasswordHash(null);
        when(userRepository.findById(7L)).thenReturn(Optional.of(linked));

        assertThatCode(() -> service.deleteAccount(7L, new DeleteAccountRequest(null))).doesNotThrowAnyException();

        verify(userRepository).delete(linked);
    }

    @Test
    void anAccountWithAPasswordStillNeedsIt() {
        User local = AuthFixtures.user(8, "local@overlab.gg", UserRole.USER, true);
        local.setPasswordHash("hash");
        when(userRepository.findById(8L)).thenReturn(Optional.of(local));

        assertThatThrownBy(() -> service.deleteAccount(8L, new DeleteAccountRequest(null)))
                .isInstanceOf(gg.overlab.backend.exception.core.BadRequestException.class);
    }

    @Test
    void theOnlyActiveAdministratorCannotDeleteTheAccount() {
        User last = admin(1, true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(last));
        when(userRepository.lockEnabledByRole(UserRole.ADMIN)).thenReturn(List.of(last));

        assertThatThrownBy(() -> service.deleteAccount(1L, new DeleteAccountRequest(null)))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void anAdministratorCanDeleteTheAccountWhenAnotherActiveOneExists() {
        User first = admin(1, true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(first));
        when(userRepository.lockEnabledByRole(UserRole.ADMIN)).thenReturn(List.of(first, admin(2, true)));

        assertThatCode(() -> service.deleteAccount(1L, new DeleteAccountRequest(null))).doesNotThrowAnyException();

        verify(userRepository).delete(first);
    }
}
