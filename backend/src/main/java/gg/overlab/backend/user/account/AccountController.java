package gg.overlab.backend.user.account;

import gg.overlab.backend.config.security.AuthCookieService;
import gg.overlab.backend.config.security.AuthenticatedUser;
import gg.overlab.backend.user.User;
import gg.overlab.backend.user.account.dto.AccountExportDto;
import gg.overlab.backend.user.account.dto.ChangeEmailRequest;
import gg.overlab.backend.user.account.dto.ChangePasswordRequest;
import gg.overlab.backend.user.account.dto.DeleteAccountRequest;
import gg.overlab.backend.user.account.dto.UpdateProfileRequest;
import gg.overlab.backend.user.auth.AuthService;
import gg.overlab.backend.user.auth.AuthTokens;
import gg.overlab.backend.user.dto.UserDto;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;
    private final AuthService authService;
    private final AuthCookieService cookieService;

    @PutMapping("/profile")
    public UserDto updateProfile(@AuthenticationPrincipal AuthenticatedUser user,
                                 @Valid @RequestBody UpdateProfileRequest request) {
        return accountService.updateProfile(user.id(), request);
    }

    @PostMapping("/password")
    public UserDto changePassword(@AuthenticationPrincipal AuthenticatedUser user,
                                  @Valid @RequestBody ChangePasswordRequest request,
                                  HttpServletResponse response) {
        User updated = accountService.changePassword(user.id(), request);
        AuthTokens tokens = authService.issueTokens(updated);
        cookieService.writeTokens(response, tokens.accessToken(), tokens.refreshToken());
        return tokens.user();
    }

    @PostMapping("/email")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeEmail(@AuthenticationPrincipal AuthenticatedUser user,
                            @Valid @RequestBody ChangeEmailRequest request) {
        accountService.requestEmailChange(user.id(), request);
    }

    @GetMapping("/export")
    public ResponseEntity<AccountExportDto> export(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"overlab-account.json\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(accountService.export(user.id()));
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthenticatedUser user,
                       @RequestBody DeleteAccountRequest request,
                       HttpServletResponse response) {
        accountService.deleteAccount(user.id(), request);
        cookieService.clearTokens(response);
    }
}
