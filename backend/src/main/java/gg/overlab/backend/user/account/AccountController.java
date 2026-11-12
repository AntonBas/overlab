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
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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

@Tag(name = "Account")
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;
    private final AccountExportService exportService;
    private final AuthService authService;
    private final AuthCookieService cookieService;

    @Operation(summary = "Change the display name")
    @PutMapping("/profile")
    public UserDto updateProfile(@AuthenticationPrincipal AuthenticatedUser user,
                                 @Valid @RequestBody UpdateProfileRequest request) {
        return accountService.updateProfile(user.id(), request);
    }

    @Operation(summary = "Change the password")
    @PostMapping("/password")
    public UserDto changePassword(@AuthenticationPrincipal AuthenticatedUser user,
                                  @Valid @RequestBody ChangePasswordRequest request,
                                  HttpServletResponse response) {
        User updated = accountService.changePassword(user.id(), request);
        AuthTokens tokens = authService.issueTokens(updated);
        cookieService.writeTokens(response, tokens.accessToken(), tokens.refreshToken());
        return tokens.user();
    }

    @Operation(summary = "Request an email change confirmed by a token")
    @PostMapping("/email")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changeEmail(@AuthenticationPrincipal AuthenticatedUser user,
                            @Valid @RequestBody ChangeEmailRequest request) {
        accountService.requestEmailChange(user.id(), request);
    }

    @Operation(summary = "Download all personal data as JSON")
    @GetMapping("/export")
    public ResponseEntity<AccountExportDto> export(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"overlab-account.json\"")
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(exportService.export(user.id()));
    }

    @Operation(summary = "Delete the account permanently")
    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthenticatedUser user,
                       @RequestBody DeleteAccountRequest request,
                       HttpServletResponse response) {
        accountService.deleteAccount(user.id(), request);
        cookieService.clearTokens(response);
    }
}
