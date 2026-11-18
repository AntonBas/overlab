package gg.overlab.backend.user;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.audit.AuditLogRepository;
import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.config.security.UserRole;
import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.exception.core.InvalidTokenException;
import gg.overlab.backend.feedback.FeedbackService;
import gg.overlab.backend.notification.EmailService;
import gg.overlab.backend.user.account.AccountService;
import gg.overlab.backend.user.account.dto.DeleteAccountRequest;
import gg.overlab.backend.user.auth.LoginAttemptLimiter;
import gg.overlab.backend.user.token.UserTokenService;
import gg.overlab.backend.user.token.UserTokenType;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AccountServiceDeleteTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final UserTokenService tokenService = mock(UserTokenService.class);
    private final EmailService emailService = mock(EmailService.class);
    private final LoginAttemptLimiter loginAttemptLimiter = mock(LoginAttemptLimiter.class);
    private final AccountService service = new AccountService(userRepository, new UserMapper(),
            mock(PasswordEncoder.class), tokenService, emailService, loginAttemptLimiter,
            AuthFixtures.properties(), mock(AuditService.class), mock(AuditLogRepository.class),
            mock(FeedbackService.class));

    private User admin(long id, boolean enabled) {
        User user = AuthFixtures.user(id, "admin" + id + "@overlab.gg", UserRole.ADMIN, true);
        user.setProvider(AuthProvider.GOOGLE);
        user.setEnabled(enabled);
        return user;
    }

    @Test
    void aPasswordlessAccountIsDeletedWithTheEmailedToken() {
        User linked = AuthFixtures.user(7, "linked@overlab.gg", UserRole.USER, true);
        linked.setProvider(AuthProvider.GOOGLE);
        linked.setPasswordHash(null);
        when(userRepository.findById(7L)).thenReturn(Optional.of(linked));
        when(tokenService.consume("good-token", UserTokenType.ACCOUNT_DELETION)).thenReturn(linked);

        assertThatCode(() -> service.deleteAccount(7L, new DeleteAccountRequest(null, "good-token")))
                .doesNotThrowAnyException();

        verify(userRepository).delete(linked);
    }

    @Test
    void aPasswordlessAccountWithoutATokenIsNotDeleted() {
        User linked = AuthFixtures.user(9, "linked@overlab.gg", UserRole.USER, true);
        linked.setPasswordHash(null);
        when(userRepository.findById(9L)).thenReturn(Optional.of(linked));

        assertThatThrownBy(() -> service.deleteAccount(9L, new DeleteAccountRequest(null, null)))
                .isInstanceOf(BadRequestException.class);
        verify(userRepository, never()).delete(linked);
    }

    @Test
    void aTokenIssuedForAnotherAccountIsRejected() {
        User linked = AuthFixtures.user(9, "linked@overlab.gg", UserRole.USER, true);
        linked.setPasswordHash(null);
        User other = AuthFixtures.user(10, "other@overlab.gg", UserRole.USER, true);
        when(userRepository.findById(9L)).thenReturn(Optional.of(linked));
        when(tokenService.consume("stolen", UserTokenType.ACCOUNT_DELETION)).thenReturn(other);

        assertThatThrownBy(() -> service.deleteAccount(9L, new DeleteAccountRequest(null, "stolen")))
                .isInstanceOf(InvalidTokenException.class);
        verify(userRepository, never()).delete(linked);
    }

    @Test
    void deletionLinkIsEmailedToAPasswordlessAccountOnly() {
        User linked = AuthFixtures.user(9, "linked@overlab.gg", UserRole.USER, true);
        linked.setPasswordHash(null);
        when(userRepository.findById(9L)).thenReturn(Optional.of(linked));
        when(tokenService.issue(linked, UserTokenType.ACCOUNT_DELETION, AuthFixtures.properties().resetTokenTtl()))
                .thenReturn("raw-token");

        service.requestDeletionConfirmation(9L);

        verify(emailService).sendAccountDeletion(linked.toEmailRecipient(), "raw-token");

        User local = AuthFixtures.user(8, "local@overlab.gg", UserRole.USER, true);
        local.setPasswordHash("hash");
        when(userRepository.findById(8L)).thenReturn(Optional.of(local));
        assertThatThrownBy(() -> service.requestDeletionConfirmation(8L)).isInstanceOf(BadRequestException.class);
    }

    @Test
    void anAccountWithAPasswordStillNeedsIt() {
        User local = AuthFixtures.user(8, "local@overlab.gg", UserRole.USER, true);
        local.setPasswordHash("hash");
        when(userRepository.findById(8L)).thenReturn(Optional.of(local));

        assertThatThrownBy(() -> service.deleteAccount(8L, new DeleteAccountRequest(null, null)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void theOnlyActiveAdministratorCannotDeleteTheAccount() {
        User last = admin(1, true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(last));
        when(userRepository.lockEnabledByRole(UserRole.ADMIN)).thenReturn(List.of(last));
        when(tokenService.consume("good-token", UserTokenType.ACCOUNT_DELETION)).thenReturn(last);

        assertThatThrownBy(() -> service.deleteAccount(1L, new DeleteAccountRequest(null, "good-token")))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void anAdministratorCanDeleteTheAccountWhenAnotherActiveOneExists() {
        User first = admin(1, true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(first));
        when(userRepository.lockEnabledByRole(UserRole.ADMIN)).thenReturn(List.of(first, admin(2, true)));
        when(tokenService.consume("good-token", UserTokenType.ACCOUNT_DELETION)).thenReturn(first);

        assertThatCode(() -> service.deleteAccount(1L, new DeleteAccountRequest(null, "good-token")))
                .doesNotThrowAnyException();

        verify(userRepository).delete(first);
    }
}
