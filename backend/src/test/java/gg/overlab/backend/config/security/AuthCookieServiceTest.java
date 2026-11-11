package gg.overlab.backend.config.security;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.user.AuthFixtures;
import jakarta.servlet.http.Cookie;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class AuthCookieServiceTest {

    private final AuthCookieService service = new AuthCookieService(secureProperties(true));

    @Test
    void writesHttpOnlyLaxCookiesWithTheRightScopeAndLifetime() {
        MockHttpServletResponse response = new MockHttpServletResponse();

        service.writeTokens(response, "access-value", "refresh-value");

        List<String> cookies = response.getHeaders(HttpHeaders.SET_COOKIE);
        String access = cookieNamed(cookies, AuthCookieService.ACCESS_COOKIE);
        String refresh = cookieNamed(cookies, AuthCookieService.REFRESH_COOKIE);
        assertThat(access).contains("access_token=access-value", "HttpOnly", "Secure", "SameSite=Lax", "Path=/;")
                .contains("Max-Age=900");
        assertThat(refresh).contains("refresh_token=refresh-value", "HttpOnly", "Secure", "SameSite=Lax",
                "Path=/api/auth").contains("Max-Age=" + Duration.ofDays(14).toSeconds());
    }

    @Test
    void secureFlagFollowsTheConfiguration() {
        MockHttpServletResponse response = new MockHttpServletResponse();

        new AuthCookieService(secureProperties(false)).writeTokens(response, "a", "r");

        assertThat(response.getHeaders(HttpHeaders.SET_COOKIE)).noneMatch(cookie -> cookie.contains("Secure"));
    }

    @Test
    void clearingExpiresBothCookiesOnTheirOriginalPaths() {
        MockHttpServletResponse response = new MockHttpServletResponse();

        service.clearTokens(response);

        List<String> cookies = response.getHeaders(HttpHeaders.SET_COOKIE);
        assertThat(cookieNamed(cookies, AuthCookieService.ACCESS_COOKIE)).contains("Max-Age=0", "Path=/;");
        assertThat(cookieNamed(cookies, AuthCookieService.REFRESH_COOKIE)).contains("Max-Age=0", "Path=/api/auth");
    }

    @Test
    void readsTheNamedCookieAndIgnoresBlankValues() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setCookies(new Cookie("access_token", "abc"), new Cookie("refresh_token", " "));

        assertThat(service.read(request, "access_token")).contains("abc");
        assertThat(service.read(request, "refresh_token")).isEmpty();
        assertThat(service.read(request, "missing")).isEmpty();
        assertThat(service.read(new MockHttpServletRequest(), "access_token")).isEmpty();
    }

    private String cookieNamed(List<String> cookies, String name) {
        return cookies.stream().filter(cookie -> cookie.startsWith(name + "=")).findFirst().orElseThrow();
    }

    private AuthProperties secureProperties(boolean secure) {
        AuthProperties base = AuthFixtures.properties();
        return new AuthProperties(base.jwtSecret(), base.accessTokenTtl(), base.refreshTokenTtl(),
                base.verificationTokenTtl(), base.resetTokenTtl(), secure, base.mailFrom(), null, null,
                base.rateLimitPerMinute());
    }
}
