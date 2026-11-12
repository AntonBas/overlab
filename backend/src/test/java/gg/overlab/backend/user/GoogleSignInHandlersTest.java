package gg.overlab.backend.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.config.security.AuthCookieService;
import gg.overlab.backend.config.security.OAuth2LoginHandlers;
import gg.overlab.backend.config.security.UserRole;
import gg.overlab.backend.exception.core.EmailAlreadyUsedException;
import gg.overlab.backend.user.auth.AuthService;
import gg.overlab.backend.user.auth.AuthTokens;
import gg.overlab.backend.user.auth.GoogleOAuthConfig;
import gg.overlab.backend.user.auth.OAuthUserService;
import gg.overlab.backend.user.dto.UserDto;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

class GoogleSignInHandlersTest {

    private static final String FRONTEND = "https://overlabgg.com";

    private final OAuthUserService oauthUserService = mock(OAuthUserService.class);
    private final AuthService authService = mock(AuthService.class);
    private final AuthCookieService cookieService = mock(AuthCookieService.class);
    private final OAuth2LoginHandlers handlers = new GoogleOAuthConfig()
            .oauth2LoginHandlers(oauthUserService, authService, cookieService, FRONTEND);
    private final MockHttpServletRequest request = new MockHttpServletRequest();
    private final MockHttpServletResponse response = new MockHttpServletResponse();

    private Authentication googleAccount(boolean emailVerified) {
        OidcUser googleUser = mock(OidcUser.class);
        when(googleUser.getEmailVerified()).thenReturn(emailVerified);
        when(googleUser.getSubject()).thenReturn("google-subject");
        when(googleUser.getEmail()).thenReturn("ana@overlab.gg");
        when(googleUser.getFullName()).thenReturn("Ana");
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(googleUser);
        return authentication;
    }

    @Test
    void signsTheUserInAndRedirectsHome() throws Exception {
        User user = AuthFixtures.user(5, "ana@overlab.gg", UserRole.USER, true);
        AuthTokens tokens = new AuthTokens("access", "refresh",
                new UserDto(5L, "ana@overlab.gg", "Ana", UserRole.USER, AuthProvider.GOOGLE, true));
        when(oauthUserService.findOrCreate("google-subject", "ana@overlab.gg", "Ana")).thenReturn(user);
        when(authService.loginAs(user)).thenReturn(tokens);

        handlers.successHandler().onAuthenticationSuccess(request, response, googleAccount(true));

        verify(cookieService).writeTokens(response, "access", "refresh");
        assertThat(response.getRedirectedUrl()).isEqualTo(FRONTEND + "/");
    }

    @Test
    void rejectsAnUnverifiedGoogleEmail() throws Exception {
        handlers.successHandler().onAuthenticationSuccess(request, response, googleAccount(false));

        assertThat(response.getRedirectedUrl()).isEqualTo(FRONTEND + "/login?error=oauth");
        verify(oauthUserService, never()).findOrCreate(any(), any(), any());
    }

    @Test
    void reportsAnEmailThatBelongsToAnotherSignInMethod() throws Exception {
        when(oauthUserService.findOrCreate(any(), any(), any())).thenThrow(new EmailAlreadyUsedException());

        handlers.successHandler().onAuthenticationSuccess(request, response, googleAccount(true));

        assertThat(response.getRedirectedUrl()).isEqualTo(FRONTEND + "/login?error=email_in_use");
        verify(cookieService, never()).writeTokens(any(), any(), any());
    }

    @Test
    void reportsAnyOtherFailureAsAGenericOAuthError() throws Exception {
        when(oauthUserService.findOrCreate(any(), any(), any())).thenThrow(new IllegalStateException("database down"));

        handlers.successHandler().onAuthenticationSuccess(request, response, googleAccount(true));

        assertThat(response.getRedirectedUrl()).isEqualTo(FRONTEND + "/login?error=oauth");
    }

    @Test
    void sendsAFailedGoogleLoginBackToTheLoginPage() throws Exception {
        handlers.failureHandler().onAuthenticationFailure(request, response,
                new BadCredentialsException("denied"));

        assertThat(response.getRedirectedUrl()).isEqualTo(FRONTEND + "/login?error=oauth");
    }
}
