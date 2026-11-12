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
import gg.overlab.backend.notification.EmailService;
import gg.overlab.backend.user.account.AccountService;
import gg.overlab.backend.user.account.dto.DeleteAccountRequest;
import gg.overlab.backend.user.token.UserTokenService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AccountServiceDeleteTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final AccountService service = new AccountService(userRepository, new UserMapper(),
            mock(PasswordEncoder.class), mock(UserTokenService.class), mock(EmailService.class),
            AuthFixtures.properties(), mock(AuditService.class), mock(AuditLogRepository.class));

    private User admin(long id, boolean enabled) {
        User user = AuthFixtures.user(id, "admin" + id + "@overlab.gg", UserRole.ADMIN, true);
        user.setProvider(AuthProvider.GOOGLE);
        user.setEnabled(enabled);
        return user;
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
