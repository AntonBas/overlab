package gg.overlab.backend.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.audit.AuditLogRepository;
import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.config.security.UserRole;
import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.TooManyRequestsException;
import gg.overlab.backend.feedback.FeedbackService;
import gg.overlab.backend.notification.EmailService;
import gg.overlab.backend.user.account.AccountService;
import gg.overlab.backend.user.account.dto.ChangeEmailRequest;
import gg.overlab.backend.user.auth.AuthService;
import gg.overlab.backend.user.auth.LoginAttemptLimiter;
import gg.overlab.backend.user.token.UserTokenService;
import gg.overlab.backend.user.token.UserTokenType;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class AccountServiceEmailChangeTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final UserTokenService tokenService = mock(UserTokenService.class);
    private final EmailService emailService = mock(EmailService.class);
    private final LoginAttemptLimiter loginAttemptLimiter = mock(LoginAttemptLimiter.class);
    private final AccountService service = new AccountService(userRepository, new UserMapper(), passwordEncoder,
            tokenService, emailService, loginAttemptLimiter, AuthFixtures.properties(), mock(AuditService.class),
            mock(AuditLogRepository.class), mock(FeedbackService.class));
    private User user;

    @BeforeEach
    void setUp() {
        user = AuthFixtures.user(5, "ana@overlab.gg", UserRole.USER, true);
        user.setPasswordHash("hash");
        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct-password", "hash")).thenReturn(true);
        when(tokenService.issue(any(), any(), any())).thenReturn("change-token");
    }

    @Test
    void aFreeAddressBecomesPendingAndBothMailboxesAreNotified() {
        service.requestEmailChange(5L, new ChangeEmailRequest(" New@Overlab.gg ", "correct-password"));

        assertThat(user.getPendingEmail()).isEqualTo("new@overlab.gg");
        verify(tokenService).revokeAll(user, UserTokenType.EMAIL_CHANGE);
        verify(emailService).sendEmailChange(user.toEmailRecipient(), "new@overlab.gg", "change-token");
        verify(emailService).sendEmailChangeNotice(user.toEmailRecipient(), "new@overlab.gg");
    }

    @Test
    void aTakenAddressNotifiesItsOwnerAndChangesNothing() {
        User owner = AuthFixtures.user(9, "taken@overlab.gg", UserRole.USER, true);
        when(userRepository.findByEmailIgnoreCase("taken@overlab.gg")).thenReturn(Optional.of(owner));

        service.requestEmailChange(5L, new ChangeEmailRequest("taken@overlab.gg", "correct-password"));

        assertThat(user.getPendingEmail()).isNull();
        verify(emailService).sendRegistrationAttemptNotice(owner.toEmailRecipient());
        verify(emailService, never()).sendEmailChange(any(), any(), any());
    }

    @Test
    void theOwnerOfATakenAddressIsNotMailedAgainWhileTheCooldownIsActive() {
        User owner = AuthFixtures.user(9, "taken@overlab.gg", UserRole.USER, true);
        when(userRepository.findByEmailIgnoreCase("taken@overlab.gg")).thenReturn(Optional.of(owner));
        when(loginAttemptLimiter.isMailThrottled(AuthService.REGISTRATION_NOTICE, "taken@overlab.gg"))
                .thenReturn(true);

        service.requestEmailChange(5L, new ChangeEmailRequest("taken@overlab.gg", "correct-password"));

        verify(emailService, never()).sendRegistrationAttemptNotice(any());
    }

    @Test
    void aWrongPasswordIsRejectedAndRecordedBeforeAnythingChanges() {
        assertThatThrownBy(() -> service.requestEmailChange(5L, new ChangeEmailRequest("new@overlab.gg", "wrong")))
                .isInstanceOf(BadRequestException.class);

        verify(loginAttemptLimiter).recordFailure("ana@overlab.gg");
        assertThat(user.getPendingEmail()).isNull();
        verify(emailService, never()).sendEmailChange(any(), any(), any());
    }

    @Test
    void aLockedAccountCannotTryPasswordsForAnEmailChange() {
        org.mockito.Mockito.doThrow(new TooManyRequestsException("locked"))
                .when(loginAttemptLimiter).requireAllowed("ana@overlab.gg");

        assertThatThrownBy(() -> service.requestEmailChange(5L,
                new ChangeEmailRequest("new@overlab.gg", "correct-password")))
                .isInstanceOf(TooManyRequestsException.class);

        verify(emailService, never()).sendEmailChange(any(), any(), any());
    }

    @Test
    void anAccountWithoutAPasswordCannotChangeItsEmailThisWay() {
        user.setPasswordHash(null);

        assertThatThrownBy(() -> service.requestEmailChange(5L,
                new ChangeEmailRequest("new@overlab.gg", "correct-password")))
                .isInstanceOf(BadRequestException.class);
    }
}
