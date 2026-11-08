package gg.overlab.backend.user.account;

import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.common.PageResponse;
import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRepository;
import gg.overlab.backend.user.UserRole;
import gg.overlab.backend.user.account.dto.AdminUserDto;
import gg.overlab.backend.user.account.dto.AdminUserFilter;
import gg.overlab.backend.user.token.UserTokenService;
import gg.overlab.backend.user.token.UserTokenType;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final Set<String> SORTABLE_COLUMNS = Set.of("createdAt", "lastLoginAt", "displayName", "email");

    private final UserRepository userRepository;
    private final UserTokenService tokenService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public PageResponse<AdminUserDto> search(AdminUserFilter filter, int page, int size) {
        Sort sort = Sort.by(filter.ascending() ? Sort.Direction.ASC : Sort.Direction.DESC, sortColumn(filter.sortBy()));
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), MAX_PAGE_SIZE), sort);
        Page<User> users = userRepository.findAll(toSpecification(filter), pageable);
        return PageResponse.of(users.map(this::toDto));
    }

    @Transactional
    public AdminUserDto setEnabled(Long id, Long actorId, boolean enabled) {
        User user = userRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("User", id));
        if (!enabled && user.getId().equals(actorId)) {
            throw new BadRequestException("You cannot block your own account");
        }
        if (!enabled) {
            requireAnotherActiveAdmin(user);
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
        if (role != UserRole.ADMIN) {
            requireAnotherActiveAdmin(user);
        }
        UserRoleSnapshot before = new UserRoleSnapshot(user.getRole());
        user.setRole(role);
        if (role != UserRole.ADMIN) {
            tokenService.revokeAll(user, UserTokenType.REFRESH);
        }
        auditService.logUpdate("User", user.getId(), before, new UserRoleSnapshot(role));
        return toDto(user);
    }

    private static String sortColumn(String sortBy) {
        if (sortBy == null || !SORTABLE_COLUMNS.contains(sortBy)) {
            return "createdAt";
        }
        return sortBy;
    }

    private static Specification<User> toSpecification(AdminUserFilter filter) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (StringUtils.hasText(filter.query())) {
                String pattern = "%" + filter.query().trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(builder.or(builder.like(builder.lower(root.get("email")), pattern),
                        builder.like(builder.lower(root.get("displayName")), pattern)));
            }
            if (filter.role() != null) {
                predicates.add(builder.equal(root.get("role"), filter.role()));
            }
            if (filter.enabled() != null) {
                predicates.add(builder.equal(root.get("enabled"), filter.enabled()));
            }
            if (filter.emailVerified() != null) {
                predicates.add(builder.equal(root.get("emailVerified"), filter.emailVerified()));
            }
            if (filter.provider() != null) {
                predicates.add(builder.equal(root.get("provider"), filter.provider()));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private void requireAnotherActiveAdmin(User target) {
        if (target.getRole() != UserRole.ADMIN || !target.isEnabled()) {
            return;
        }
        boolean anotherActiveAdmin = userRepository.lockEnabledByRole(UserRole.ADMIN).stream()
                .anyMatch(admin -> !admin.getId().equals(target.getId()));
        if (!anotherActiveAdmin) {
            throw new BadRequestException("At least one active administrator must remain");
        }
    }

    private AdminUserDto toDto(User user) {
        return new AdminUserDto(user.getId(), user.getEmail(), user.getDisplayName(), user.getRole(),
                user.getProvider(), user.isEmailVerified(), user.isEnabled(), user.getCreatedAt(),
                user.getLastLoginAt());
    }
}
