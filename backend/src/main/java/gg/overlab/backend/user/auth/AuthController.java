package gg.overlab.backend.user.auth;

import gg.overlab.backend.config.security.AuthCookieService;
import gg.overlab.backend.config.security.AuthenticatedUser;
import gg.overlab.backend.exception.core.ConcurrentRefreshException;
import gg.overlab.backend.exception.core.InvalidTokenException;
import gg.overlab.backend.exception.core.SessionExpiredException;
import gg.overlab.backend.user.auth.dto.EmailRequest;
import gg.overlab.backend.user.auth.dto.LoginRequest;
import gg.overlab.backend.user.auth.dto.RegisterRequest;
import gg.overlab.backend.user.auth.dto.ResetPasswordRequest;
import gg.overlab.backend.user.auth.dto.TokenRequest;
import gg.overlab.backend.user.dto.UserDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Authentication")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService cookieService;

    @Operation(summary = "Register with email and password")
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserDto register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @Operation(summary = "Sign in with email and password and set auth cookies")
    @PostMapping("/login")
    public UserDto login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthTokens tokens = authService.login(request);
        cookieService.writeTokens(response, tokens.accessToken(), tokens.refreshToken());
        return tokens.user();
    }

    @Operation(summary = "Rotate the refresh token and issue new auth cookies")
    @PostMapping("/refresh")
    public UserDto refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = cookieService.read(request, AuthCookieService.REFRESH_COOKIE)
                .orElseThrow(SessionExpiredException::new);
        AuthTokens tokens;
        try {
            tokens = authService.refresh(refreshToken);
        } catch (ConcurrentRefreshException exception) {
            throw new SessionExpiredException();
        } catch (InvalidTokenException exception) {
            cookieService.clearTokens(response);
            throw new SessionExpiredException();
        }
        cookieService.writeTokens(response, tokens.accessToken(), tokens.refreshToken());
        return tokens.user();
    }

    @Operation(summary = "Revoke the refresh token and clear auth cookies")
    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(cookieService.read(request, AuthCookieService.REFRESH_COOKIE).orElse(null));
        cookieService.clearTokens(response);
    }

    @Operation(summary = "Get the signed-in user")
    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal AuthenticatedUser user) {
        return authService.me(user.id());
    }

    @Operation(summary = "Confirm an email address with a token")
    @PostMapping("/verify-email")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void verifyEmail(@Valid @RequestBody TokenRequest request) {
        authService.verifyEmail(request.token());
    }

    @Operation(summary = "Send the confirmation email again")
    @PostMapping("/resend-verification")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resendVerification(@Valid @RequestBody EmailRequest request) {
        authService.resendVerification(request.email());
    }

    @Operation(summary = "Send a password reset email")
    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void forgotPassword(@Valid @RequestBody EmailRequest request) {
        authService.forgotPassword(request.email());
    }

    @Operation(summary = "Set a new password using a reset token")
    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.password());
    }
}
