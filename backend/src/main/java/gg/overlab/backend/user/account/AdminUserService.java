package gg.overlab.backend.user.account;

import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.common.PageResponse;
import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRepository;
import gg.overlab.backend.user.UserRole;
import gg.overlab.backend.user.account.dto.AdminUserDto;
import gg.overlab.backend.user.token.UserTokenService;
import gg.overlab.backend.user.token.UserTokenType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final int MAX_PAGE_SIZE = 100;

    private final UserRepository userRepository;
    private final UserTokenService tokenService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public PageResponse<AdminUserDto> search(String query, int page, int size) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        String term = StringUtils.hasText(query) ? query.trim() : "";
        Page<User> users = userRepository
                .findByEmailContainingIgnoreCaseOrDisplayNameContainingIgnoreCase(term, term, pageable);
        return PageResponse.of(users.map(this::toDto));
    }

    @Transactional
    public AdminUserDto setEnabled(Long id, Long actorId, boolean enabled) {
        User user = userRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("User", id));
        if (!enabled && user.getId().equals(actorId)) {
            throw new BadRequestException("You cannot block your own account");
        }
        UserStatusSnapshot before = new UserStatusSnapshot(user.isEnabled());
        user.setEnabled(enabled);
        if (!enabled) {
            tokenService.revokeAll(user, UserTokenType.REFRESH);
        }
        auditService.logUpdate("User", user.getId(), before, new UserStatusSnapshot(enabled));
        return toDto(user);
    }

    @Transactional
    public AdminUserDto setRole(Long id, Long actorId, UserRole role) {
        User user = userRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("User", id));
        if (user.getId().equals(actorId)) {
            throw new BadRequestException("You cannot change your own role");
        }
        if (user.getRole() == role) {
            return toDto(user);
        }
        UserRoleSnapshot before = new UserRoleSnapshot(user.getRole());
        user.setRole(role);
        if (role != UserRole.ADMIN) {
            tokenService.revokeAll(user, UserTokenType.REFRESH);
        }
        auditService.logUpdate("User", user.getId(), before, new UserRoleSnapshot(role));
        return toDto(user);
    }

    private AdminUserDto toDto(User user) {
        return new AdminUserDto(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole(),
                user.getProvider(), user.isEmailVerified(), user.isEnabled(), user.getCreatedAt(),
                user.getLastLoginAt());
    }
}
