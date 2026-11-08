package gg.overlab.backend.user.account;

import gg.overlab.backend.common.PageResponse;
import gg.overlab.backend.config.security.AuthenticatedUser;
import gg.overlab.backend.user.AuthProvider;
import gg.overlab.backend.user.UserRole;
import gg.overlab.backend.user.account.dto.AdminUserDto;
import gg.overlab.backend.user.account.dto.AdminUserFilter;
import gg.overlab.backend.user.account.dto.SetEnabledRequest;
import gg.overlab.backend.user.account.dto.SetRoleRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Users (admin)")
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @Operation(summary = "Search and filter users by email, name, role, status, verification and sign-in method")
    @GetMapping
    public PageResponse<AdminUserDto> search(@RequestParam(required = false) String q,
                                             @RequestParam(required = false) UserRole role,
                                             @RequestParam(required = false) Boolean enabled,
                                             @RequestParam(required = false) Boolean emailVerified,
                                             @RequestParam(required = false) AuthProvider provider,
                                             @RequestParam(defaultValue = "createdAt") String sort,
                                             @RequestParam(defaultValue = "desc") String direction,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        AdminUserFilter filter = new AdminUserFilter(q, role, enabled, emailVerified, provider, sort,
                "asc".equalsIgnoreCase(direction));
        return adminUserService.search(filter, page, size);
    }

    @Operation(summary = "Enable or disable a user")
    @PutMapping("/{id}/enabled")
    public AdminUserDto setEnabled(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser actor,
                                   @Valid @RequestBody SetEnabledRequest request) {
        return adminUserService.setEnabled(id, actor.id(), request.enabled());
    }

    @Operation(summary = "Change a user's role")
    @PutMapping("/{id}/role")
    public AdminUserDto setRole(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser actor,
                                @Valid @RequestBody SetRoleRequest request) {
        return adminUserService.setRole(id, actor.id(), request.role());
    }
}
