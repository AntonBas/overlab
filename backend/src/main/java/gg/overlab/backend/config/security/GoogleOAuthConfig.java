package gg.overlab.backend.config.security;

import gg.overlab.backend.user.AuthProvider;
import gg.overlab.backend.user.User;
import gg.overlab.backend.user.auth.AuthService;
import gg.overlab.backend.user.auth.AuthTokens;
import gg.overlab.backend.user.auth.OAuthUserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

@Slf4j
@Configuration
@ConditionalOnExpression("'${GOOGLE_CLIENT_ID:}' != '' and '${GOOGLE_CLIENT_SECRET:}' != ''")
public class GoogleOAuthConfig {

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository(
            @Value("${GOOGLE_CLIENT_ID}") String clientId,
            @Value("${GOOGLE_CLIENT_SECRET}") String clientSecret) {
        return new InMemoryClientRegistrationRepository(CommonOAuth2Provider.GOOGLE.getBuilder("google")
                .clientId(clientId)
                .clientSecret(clientSecret)
                .scope("openid", "profile", "email")
                .build());
    }

    @Bean
    public OAuth2LoginHandlers oauth2LoginHandlers(OAuthUserService oauthUserService,
                                                   AuthService authService,
                                                   AuthCookieService cookieService,
                                                   @Value("${app.frontend-url}") String frontendUrl) {
        return new OAuth2LoginHandlers(
                (request, response, authentication) -> {
                    if (!(authentication.getPrincipal() instanceof OidcUser googleUser)
                            || !Boolean.TRUE.equals(googleUser.getEmailVerified())) {
                        response.sendRedirect(frontendUrl + "/login?error=oauth");
                        return;
                    }
                    try {
                        User user = oauthUserService.findOrCreate(AuthProvider.GOOGLE, googleUser.getSubject(),
                                googleUser.getEmail(), googleUser.getFullName());
                        AuthTokens tokens = authService.issueTokens(user);
                        cookieService.writeTokens(response, tokens.accessToken(), tokens.refreshToken());
                        if (request.getSession(false) != null) {
                            request.getSession(false).invalidate();
                        }
                        response.sendRedirect(frontendUrl + "/");
                    } catch (RuntimeException exception) {
                        log.warn("Google sign-in rejected: {}", exception.getMessage());
                        response.sendRedirect(frontendUrl + "/login?error=email_in_use");
                    }
                },
                (request, response, exception) -> {
                    log.warn("Google sign-in failed: {}", exception.getMessage());
                    response.sendRedirect(frontendUrl + "/login?error=oauth");
                });
    }
}
