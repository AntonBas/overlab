package gg.overlab.backend.user.account;

import gg.overlab.backend.common.PageResponse;
import gg.overlab.backend.config.security.AuthenticatedUser;
import gg.overlab.backend.user.account.dto.AdminUserDto;
import gg.overlab.backend.user.account.dto.SetEnabledRequest;
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

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public PageResponse<AdminUserDto> search(@RequestParam(required = false) String q,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        return adminUserService.search(q, page, size);
    }

    @PutMapping("/{id}/enabled")
    public AdminUserDto setEnabled(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser actor,
                                   @Valid @RequestBody SetEnabledRequest request) {
        return adminUserService.setEnabled(id, actor.id(), request.enabled());
    }
}
