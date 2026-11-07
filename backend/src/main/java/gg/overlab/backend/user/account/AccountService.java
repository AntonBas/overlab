package gg.overlab.backend.user.account;

import gg.overlab.backend.audit.AuditAction;
import gg.overlab.backend.audit.AuditLogRepository;
import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.config.security.AuthProperties;
import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.notification.EmailService;
import gg.overlab.backend.user.AuthProvider;
import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserMapper;
import gg.overlab.backend.user.UserRepository;
import gg.overlab.backend.user.UserRole;
import gg.overlab.backend.user.account.dto.AccountExportDto;
import gg.overlab.backend.user.account.dto.ChangeEmailRequest;
import gg.overlab.backend.user.account.dto.ChangePasswordRequest;
import gg.overlab.backend.user.account.dto.DeleteAccountRequest;
import gg.overlab.backend.user.account.dto.UpdateProfileRequest;
import gg.overlab.backend.user.auth.exception.EmailAlreadyUsedException;
import gg.overlab.backend.user.dto.UserDto;
import gg.overlab.backend.user.personal.PersonalService;
import gg.overlab.backend.user.token.UserTokenService;
import gg.overlab.backend.user.token.UserTokenType;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountService {

    private static final String WRONG_PASSWORD = "Current password is incorrect";

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final UserTokenService tokenService;
    private final EmailService emailService;
    private final AuthProperties properties;
    private final AuditService auditService;
    private final AuditLogRepository auditLogRepository;
    private final PersonalService personalService;

    @Transactional
    public UserDto updateProfile(Long userId, UpdateProfileRequest request) {
        User user = load(userId);
        user.setDisplayName(request.displayName().trim());
        auditService.logUserEvent(AuditAction.UPDATE, user.getId(), user.getRole().name());
        return userMapper.toDto(user);
    }

    @Transactional
    public User changePassword(Long userId, ChangePasswordRequest request) {
        User user = loadLocal(userId);
        requirePassword(user, request.currentPassword());
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        tokenService.revokeAll(user, UserTokenType.REFRESH);
        auditService.logUserEvent(AuditAction.PASSWORD_CHANGE, user.getId(), user.getRole().name());
        return user;
    }

    @Transactional
    public void requestEmailChange(Long userId, ChangeEmailRequest request) {
        User user = loadLocal(userId);
        requirePassword(user, request.currentPassword());
        String newEmail = request.newEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(newEmail)) {
            throw new EmailAlreadyUsedException();
        }
        user.setPendingEmail(newEmail);
        tokenService.revokeAll(user, UserTokenType.EMAIL_CHANGE);
        String token = tokenService.issue(user, UserTokenType.EMAIL_CHANGE, properties.verificationTokenTtl());
        emailService.sendEmailChange(user, newEmail, token);
    }

    @Transactional
    public void deleteAccount(Long userId, DeleteAccountRequest request) {
        User user = load(userId);
        if (user.getProvider() == AuthProvider.LOCAL) {
            requirePassword(user, request.password());
        }
        if (user.getRole() == UserRole.ADMIN && userRepository.countByRole(UserRole.ADMIN) <= 1) {
            throw new ConflictException("The last administrator cannot be deleted");
        }
        auditLogRepository.anonymizeActor(user.getId());
        auditLogRepository.anonymizeUserEntity(String.valueOf(user.getId()));
        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public AccountExportDto export(Long userId) {
        User user = load(userId);
        return new AccountExportDto(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole(),
                user.getProvider(), user.isEmailVerified(), user.getCreatedAt(), user.getLastLoginAt(),
                personalService.favorites(userId), personalService.preferences(userId));
    }

    private User load(Long userId) {
        return userRepository.findById(userId).orElseThrow(() -> new EntityNotFoundException("User", userId));
    }

    private User loadLocal(Long userId) {
        User user = load(userId);
        if (user.getProvider() != AuthProvider.LOCAL || user.getPasswordHash() == null) {
            throw new BadRequestException("This account signs in with " + user.getProvider()
                    + " and has no password");
        }
        return user;
    }

    private void requirePassword(User user, String password) {
        if (password == null || user.getPasswordHash() == null
                || !passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BadRequestException(WRONG_PASSWORD);
        }
    }
}
