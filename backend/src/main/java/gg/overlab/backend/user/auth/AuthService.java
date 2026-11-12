package gg.overlab.backend.user.auth;

import gg.overlab.backend.audit.AuditAction;
import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.config.security.AuthProperties;
import gg.overlab.backend.config.security.JwtTokenProvider;
import gg.overlab.backend.config.security.UserRole;
import gg.overlab.backend.exception.core.EmailNotVerifiedException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.exception.core.InvalidCredentialsException;
import gg.overlab.backend.exception.core.InvalidTokenException;
import gg.overlab.backend.notification.EmailService;
import gg.overlab.backend.user.AuthProvider;
import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserMapper;
import gg.overlab.backend.user.UserRepository;
import gg.overlab.backend.user.auth.dto.LoginRequest;
import gg.overlab.backend.user.auth.dto.RegisterRequest;
import gg.overlab.backend.user.dto.UserDto;
import gg.overlab.backend.user.token.ConsumedToken;
import gg.overlab.backend.user.token.UserTokenService;
import gg.overlab.backend.user.token.UserTokenType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserTokenService tokenService;
    private final EmailService emailService;
    private final AuthProperties properties;
    private final AuditService auditService;
    private final LoginAttemptLimiter loginAttemptLimiter;

    private volatile String dummyPasswordHash;

    @Transactional
    public void register(RegisterRequest request) {
        String email = normalize(request.email());
        String passwordHash = passwordEncoder.encode(request.password());
        Optional<User> existing = userRepository.findByEmailIgnoreCase(email);
        if (existing.isPresent()) {
            emailService.sendRegistrationAttemptNotice(existing.get().toEmailRecipient());
            return;
        }
        User user = new User();
        user.setEmail(email);
        user.setDisplayName(request.displayName().trim());
        user.setPasswordHash(passwordHash);
        user.setRole(UserRole.USER);
        user.setProvider(AuthProvider.LOCAL);
        user = userRepository.save(user);
        sendVerification(user);
        auditService.logUserEvent(AuditAction.CREATE, user.getId(), user.getRole().name());
    }

    @Transactional
    public AuthTokens login(LoginRequest request) {
        String email = normalize(request.email());
        loginAttemptLimiter.requireAllowed(email);
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        boolean passwordMatches = passwordEncoder.matches(request.password(), hashFor(user));
        if (user == null || user.getPasswordHash() == null || !passwordMatches || !user.isEnabled()) {
            loginAttemptLimiter.recordFailure(email);
            throw new InvalidCredentialsException();
        }
        loginAttemptLimiter.reset(email);
        if (!user.isEmailVerified()) {
            throw new EmailNotVerifiedException();
        }
        return loginAs(user);
    }

    @Transactional
    public AuthTokens loginAs(User user) {
        if (!user.isEnabled()) {
            throw new InvalidCredentialsException();
        }
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);
        AuthTokens tokens = issueTokens(user);
        auditService.logUserEvent(AuditAction.LOGIN, user.getId(), user.getRole().name());
        return tokens;
    }

    @Transactional(noRollbackFor = InvalidTokenException.class)
    public AuthTokens refresh(String rawRefreshToken) {
        User user = tokenService.consume(rawRefreshToken, UserTokenType.REFRESH);
        if (!user.isEnabled()) {
            throw new InvalidTokenException();
        }
        return issueTokens(user);
    }

    @Transactional
    public AuthTokens issueTokens(User user) {
        String refreshToken = tokenService.issue(user, UserTokenType.REFRESH, properties.refreshTokenTtl());
        return new AuthTokens(jwtTokenProvider.createAccessToken(user), refreshToken, userMapper.toDto(user));
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken != null) {
            tokenService.revoke(rawRefreshToken, UserTokenType.REFRESH);
        }
    }

    @Transactional(readOnly = true)
    public UserDto me(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId));
        return userMapper.toDto(user);
    }

    @Transactional
    public void verifyEmail(String rawToken) {
        ConsumedToken consumed = tokenService.consumeAny(rawToken,
                List.of(UserTokenType.EMAIL_VERIFICATION, UserTokenType.EMAIL_CHANGE));
        if (consumed.type() == UserTokenType.EMAIL_CHANGE) {
            applyEmailChange(consumed.user());
            return;
        }
        consumed.user().setEmailVerified(true);
    }

    private void applyEmailChange(User user) {
        String newEmail = user.getPendingEmail();
        if (newEmail == null || userRepository.existsByEmailIgnoreCase(newEmail)) {
            throw new InvalidTokenException();
        }
        user.setEmail(newEmail);
        user.setPendingEmail(null);
        user.setEmailVerified(true);
        auditService.logUserEvent(AuditAction.UPDATE, user.getId(), user.getRole().name());
    }

    @Transactional
    public void resendVerification(String email) {
        if (loginAttemptLimiter.isMailThrottled(normalize(email))) {
            return;
        }
        userRepository.findByEmailIgnoreCase(normalize(email))
                .filter(user -> !user.isEmailVerified() && user.getProvider() == AuthProvider.LOCAL)
                .ifPresent(this::sendVerification);
    }

    @Transactional
    public void forgotPassword(String email) {
        if (loginAttemptLimiter.isMailThrottled(normalize(email))) {
            return;
        }
        userRepository.findByEmailIgnoreCase(normalize(email))
                .filter(User::isEnabled)
                .ifPresent(user -> {
                    if (user.getProvider() != AuthProvider.LOCAL) {
                        emailService.sendGoogleSignInNotice(user.toEmailRecipient());
                        return;
                    }
                    tokenService.revokeAll(user, UserTokenType.PASSWORD_RESET);
                    String token = tokenService.issue(user, UserTokenType.PASSWORD_RESET, properties.resetTokenTtl());
                    emailService.sendPasswordReset(user.toEmailRecipient(), token);
                });
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        User user = tokenService.consume(rawToken, UserTokenType.PASSWORD_RESET);
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setEmailVerified(true);
        tokenService.revokeAll(user, UserTokenType.REFRESH);
        auditService.logUserEvent(AuditAction.PASSWORD_CHANGE, user.getId(), user.getRole().name());
    }

    private void sendVerification(User user) {
        tokenService.revokeAll(user, UserTokenType.EMAIL_VERIFICATION);
        String token = tokenService.issue(user, UserTokenType.EMAIL_VERIFICATION, properties.verificationTokenTtl());
        emailService.sendVerification(user.toEmailRecipient(), token);
    }

    private String hashFor(User user) {
        if (user != null && user.getPasswordHash() != null) {
            return user.getPasswordHash();
        }
        if (dummyPasswordHash == null) {
            dummyPasswordHash = passwordEncoder.encode("overlab-dummy-password");
        }
        return dummyPasswordHash;
    }

    private String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
