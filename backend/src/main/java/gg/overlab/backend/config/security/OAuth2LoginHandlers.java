package gg.overlab.backend.config.security;

import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

public record OAuth2LoginHandlers(
        AuthenticationSuccessHandler successHandler,
        AuthenticationFailureHandler failureHandler) {
}
