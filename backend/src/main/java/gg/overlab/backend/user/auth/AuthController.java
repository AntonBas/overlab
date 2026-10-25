package gg.overlab.backend.user.auth;

import gg.overlab.backend.config.security.AuthCookieService;
import gg.overlab.backend.config.security.AuthenticatedUser;
import gg.overlab.backend.user.auth.dto.EmailRequest;
import gg.overlab.backend.user.auth.dto.LoginRequest;
import gg.overlab.backend.user.auth.dto.RegisterRequest;
import gg.overlab.backend.user.auth.dto.ResetPasswordRequest;
import gg.overlab.backend.user.auth.dto.TokenRequest;
import gg.overlab.backend.user.auth.exception.InvalidTokenException;
import gg.overlab.backend.user.dto.UserDto;
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

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService cookieService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserDto register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public UserDto login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        AuthTokens tokens = authService.login(request);
        cookieService.writeTokens(response, tokens.accessToken(), tokens.refreshToken());
        return tokens.user();
    }

    @PostMapping("/refresh")
    public UserDto refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = cookieService.read(request, AuthCookieService.REFRESH_COOKIE)
                .orElseThrow(InvalidTokenException::new);
        AuthTokens tokens = authService.refresh(refreshToken);
        cookieService.writeTokens(response, tokens.accessToken(), tokens.refreshToken());
        return tokens.user();
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(cookieService.read(request, AuthCookieService.REFRESH_COOKIE).orElse(null));
        cookieService.clearTokens(response);
    }

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal AuthenticatedUser user) {
        return authService.me(user.id());
    }

    @PostMapping("/verify-email")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void verifyEmail(@Valid @RequestBody TokenRequest request) {
        authService.verifyEmail(request.token());
    }

    @PostMapping("/resend-verification")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resendVerification(@Valid @RequestBody EmailRequest request) {
        authService.resendVerification(request.email());
    }

    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void forgotPassword(@Valid @RequestBody EmailRequest request) {
        authService.forgotPassword(request.email());
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.token(), request.password());
    }
}
