package gg.overlab.backend.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.audit.AuditAction;
import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.config.security.JwtTokenProvider;
import gg.overlab.backend.config.security.UserRole;
import gg.overlab.backend.exception.core.EmailNotVerifiedException;
import gg.overlab.backend.exception.core.InvalidCredentialsException;
import gg.overlab.backend.exception.core.InvalidTokenException;
import gg.overlab.backend.exception.core.TooManyRequestsException;
import gg.overlab.backend.notification.EmailRecipient;
import gg.overlab.backend.notification.EmailService;
import gg.overlab.backend.user.auth.AuthService;
import gg.overlab.backend.user.auth.AuthTokens;
import gg.overlab.backend.user.auth.LoginAttemptLimiter;
import gg.overlab.backend.user.auth.dto.LoginRequest;
import gg.overlab.backend.user.auth.dto.RegisterRequest;
import gg.overlab.backend.user.token.ConsumedToken;
import gg.overlab.backend.user.token.UserTokenService;
import gg.overlab.backend.user.token.UserTokenType;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

class AuthServiceTest {

    private static final List<UserTokenType> VERIFICATION_TYPES =
            List.of(UserTokenType.EMAIL_VERIFICATION, UserTokenType.EMAIL_CHANGE);

    private final UserRepository userRepository = mock(UserRepository.class);
    private final UserTokenService tokenService = mock(UserTokenService.class);
    private final EmailService emailService = mock(EmailService.class);
    private final AuditService auditService = mock(AuditService.class);
    private final LoginAttemptLimiter loginAttemptLimiter = mock(LoginAttemptLimiter.class);
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(4);
    private final JwtTokenProvider jwtTokenProvider =
            new JwtTokenProvider(AuthFixtures.properties(), new MockEnvironment());
    private final AuthService service = new AuthService(userRepository, new UserMapper(), passwordEncoder,
            jwtTokenProvider, tokenService, emailService, AuthFixtures.properties(), auditService,
            loginAttemptLimiter);

    private User existingUser;

    @BeforeEach
    void setUp() {
        existingUser = AuthFixtures.user(5, "ana@overlab.gg", UserRole.USER, true);
        existingUser.setPasswordHash(passwordEncoder.encode("correct-password"));
        existingUser.setProvider(AuthProvider.LOCAL);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tokenService.issue(any(), any(), any())).thenReturn("raw-token");
    }

    @Test
    void registerCreatesUnverifiedUserAndSendsVerification() {
        service.register(new RegisterRequest("  New@Overlab.gg ", "password-123", " Newbie "));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertThat(saved.getValue().getEmail()).isEqualTo("new@overlab.gg");
        assertThat(saved.getValue().getDisplayName()).isEqualTo("Newbie");
        assertThat(saved.getValue().getPasswordHash()).isNotEqualTo("password-123");
        assertThat(saved.getValue().getRole()).isEqualTo(UserRole.USER);
        assertThat(saved.getValue().isEmailVerified()).isFalse();
        verify(emailService).sendVerification(any(EmailRecipient.class), eq("raw-token"));
        verify(auditService).logUserEvent(eq(AuditAction.CREATE), any(), eq("USER"));
    }

    @Test
    void registerForAnExistingEmailOnlyNotifiesTheOwner() {
        when(userRepository.findByEmailIgnoreCase("ana@overlab.gg")).thenReturn(Optional.of(existingUser));

        service.register(new RegisterRequest("ana@overlab.gg", "password-123", "Ana"));

        verify(emailService).sendRegistrationAttemptNotice(existingUser.toEmailRecipient());
        verify(userRepository, never()).save(any());
        verify(emailService, never()).sendVerification(any(), any());
    }

    @Test
    void loginReturnsTokensForValidCredentials() {
        when(userRepository.findByEmailIgnoreCase("ana@overlab.gg")).thenReturn(Optional.of(existingUser));

        AuthTokens tokens = service.login(new LoginRequest("Ana@overlab.gg", "correct-password"));

        assertThat(jwtTokenProvider.parse(tokens.accessToken())).isPresent();
        assertThat(tokens.refreshToken()).isEqualTo("raw-token");
        assertThat(tokens.user().email()).isEqualTo("ana@overlab.gg");
        assertThat(existingUser.getLastLoginAt()).isNotNull();
        verify(auditService).logUserEvent(AuditAction.LOGIN, 5L, "USER");
    }

    @Test
    void refreshDoesNotCountAsALogin() {
        when(tokenService.consume("old-refresh", UserTokenType.REFRESH)).thenReturn(existingUser);

        service.refresh("old-refresh");

        assertThat(existingUser.getLastLoginAt()).isNull();
    }

    @Test
    void loginRejectsWrongPassword() {
        when(userRepository.findByEmailIgnoreCase("ana@overlab.gg")).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> service.login(new LoginRequest("ana@overlab.gg", "wrong-password")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void loginRecordsFailureForWrongPasswordAndResetsOnSuccess() {
        when(userRepository.findByEmailIgnoreCase("ana@overlab.gg")).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> service.login(new LoginRequest("ana@overlab.gg", "wrong-password")))
                .isInstanceOf(InvalidCredentialsException.class);
        verify(loginAttemptLimiter).recordFailure("ana@overlab.gg");

        service.login(new LoginRequest("ana@overlab.gg", "correct-password"));
        verify(loginAttemptLimiter).reset("ana@overlab.gg");
    }

    @Test
    void loginIsRejectedBeforeCheckingPasswordWhenAccountIsLocked() {
        org.mockito.Mockito.doThrow(new TooManyRequestsException("locked"))
                .when(loginAttemptLimiter).requireAllowed("ana@overlab.gg");

        assertThatThrownBy(() -> service.login(new LoginRequest("ana@overlab.gg", "correct-password")))
                .isInstanceOf(TooManyRequestsException.class);
        verify(userRepository, never()).findByEmailIgnoreCase(any());
    }

    @Test
    void loginRejectsUnknownUserWithSameError() {
        when(userRepository.findByEmailIgnoreCase("ghost@overlab.gg")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.login(new LoginRequest("ghost@overlab.gg", "whatever-123")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void loginRejectsDisabledUser() {
        existingUser.setEnabled(false);
        when(userRepository.findByEmailIgnoreCase("ana@overlab.gg")).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> service.login(new LoginRequest("ana@overlab.gg", "correct-password")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void loginRequiresVerifiedEmail() {
        existingUser.setEmailVerified(false);
        when(userRepository.findByEmailIgnoreCase("ana@overlab.gg")).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> service.login(new LoginRequest("ana@overlab.gg", "correct-password")))
                .isInstanceOf(EmailNotVerifiedException.class);
    }

    @Test
    void googleAccountCannotLogInWithPassword() {
        existingUser.setPasswordHash(null);
        existingUser.setProvider(AuthProvider.GOOGLE);
        when(userRepository.findByEmailIgnoreCase("ana@overlab.gg")).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> service.login(new LoginRequest("ana@overlab.gg", "anything-123")))
                .isInstanceOf(InvalidCredentialsException.class);
    }

    @Test
    void forgotPasswordForUnknownEmailSendsNothing() {
        when(userRepository.findByEmailIgnoreCase("ghost@overlab.gg")).thenReturn(Optional.empty());

        service.forgotPassword("ghost@overlab.gg");

        verify(emailService, never()).sendPasswordReset(any(), any());
    }

    @Test
    void forgotPasswordIsSkippedWhileTheMailCooldownIsActive() {
        when(loginAttemptLimiter.isMailThrottled("ana@overlab.gg")).thenReturn(true);

        service.forgotPassword("ana@overlab.gg");

        verify(emailService, never()).sendPasswordReset(any(), any());
        verify(tokenService, never()).revokeAll(any(), any());
    }

    @Test
    void forgotPasswordSendsResetTokenToLocalUser() {
        when(userRepository.findByEmailIgnoreCase("ana@overlab.gg")).thenReturn(Optional.of(existingUser));

        service.forgotPassword("ana@overlab.gg");

        verify(emailService).sendPasswordReset(existingUser.toEmailRecipient(), "raw-token");
    }

    @Test
    void forgotPasswordIgnoresGoogleAccounts() {
        existingUser.setProvider(AuthProvider.GOOGLE);
        when(userRepository.findByEmailIgnoreCase("ana@overlab.gg")).thenReturn(Optional.of(existingUser));

        service.forgotPassword("ana@overlab.gg");

        verify(emailService, never()).sendPasswordReset(any(), any());
    }

    @Test
    void resetPasswordChangesHashAndRevokesRefreshTokens() {
        String oldHash = existingUser.getPasswordHash();
        when(tokenService.consume("reset-token", UserTokenType.PASSWORD_RESET)).thenReturn(existingUser);

        service.resetPassword("reset-token", "brand-new-password");

        assertThat(existingUser.getPasswordHash()).isNotEqualTo(oldHash);
        assertThat(passwordEncoder.matches("brand-new-password", existingUser.getPasswordHash())).isTrue();
        verify(tokenService).revokeAll(existingUser, UserTokenType.REFRESH);
        verify(auditService).logUserEvent(AuditAction.PASSWORD_CHANGE, 5L, "USER");
    }

    @Test
    void verifyEmailMarksUserVerified() {
        existingUser.setEmailVerified(false);
        when(tokenService.consumeAny("verify-token", VERIFICATION_TYPES))
                .thenReturn(new ConsumedToken(existingUser, UserTokenType.EMAIL_VERIFICATION));

        service.verifyEmail("verify-token");

        assertThat(existingUser.isEmailVerified()).isTrue();
    }

    @Test
    void verifyEmailAppliesPendingEmailForEmailChangeToken() {
        existingUser.setPendingEmail("new@overlab.gg");
        when(userRepository.existsByEmailIgnoreCase("new@overlab.gg")).thenReturn(false);
        when(tokenService.consumeAny("change-token", VERIFICATION_TYPES))
                .thenReturn(new ConsumedToken(existingUser, UserTokenType.EMAIL_CHANGE));

        service.verifyEmail("change-token");

        assertThat(existingUser.getEmail()).isEqualTo("new@overlab.gg");
        assertThat(existingUser.getPendingEmail()).isNull();
        assertThat(existingUser.isEmailVerified()).isTrue();
    }

    @Test
    void verifyEmailRejectsEmailChangeWhenAddressWasTakenMeanwhile() {
        existingUser.setPendingEmail("taken@overlab.gg");
        when(userRepository.existsByEmailIgnoreCase("taken@overlab.gg")).thenReturn(true);
        when(tokenService.consumeAny("change-token", VERIFICATION_TYPES))
                .thenReturn(new ConsumedToken(existingUser, UserTokenType.EMAIL_CHANGE));

        assertThatThrownBy(() -> service.verifyEmail("change-token")).isInstanceOf(InvalidTokenException.class);
    }

    @Test
    void logoutRevokesRefreshToken() {
        service.logout("refresh-raw");

        verify(tokenService).revoke("refresh-raw", UserTokenType.REFRESH);
    }

    @Test
    void logoutWithoutTokenDoesNothing() {
        service.logout(null);

        verify(tokenService, never()).revoke(any(), any());
    }
}
