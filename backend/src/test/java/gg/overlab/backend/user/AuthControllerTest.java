package gg.overlab.backend.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import gg.overlab.backend.config.security.AuthCookieService;
import gg.overlab.backend.config.security.UserRole;
import gg.overlab.backend.exception.api.ApiErrorHandler;
import gg.overlab.backend.exception.core.EmailAlreadyUsedException;
import gg.overlab.backend.exception.core.InvalidCredentialsException;
import gg.overlab.backend.user.auth.AuthController;
import gg.overlab.backend.user.auth.AuthService;
import gg.overlab.backend.user.auth.AuthTokens;
import gg.overlab.backend.user.dto.UserDto;
import jakarta.servlet.http.Cookie;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class AuthControllerTest {

    private final AuthService authService = mock(AuthService.class);
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        AuthCookieService cookieService = new AuthCookieService(AuthFixtures.properties());
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authService, cookieService))
                .setControllerAdvice(new ApiErrorHandler())
                .build();
    }

    @Test
    void registerReturnsCreatedUser() throws Exception {
        when(authService.register(any())).thenReturn(userDto());

        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"ana@overlab.gg\",\"password\":\"password-123\",\"displayName\":\"Ana\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("ana@overlab.gg"));
    }

    @Test
    void registerValidatesBody() throws Exception {
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"bad\",\"password\":\"short\",\"displayName\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.subErrors.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(3)));
    }

    @Test
    void registerDuplicateEmailReturnsConflict() throws Exception {
        when(authService.register(any())).thenThrow(new EmailAlreadyUsedException());

        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"ana@overlab.gg\",\"password\":\"password-123\",\"displayName\":\"Ana\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void loginSetsHttpOnlyCookies() throws Exception {
        when(authService.login(any())).thenReturn(new AuthTokens("access-jwt", "refresh-raw", userDto()));

        MvcResult result = mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"ana@overlab.gg\",\"password\":\"password-123\"}"))
                .andExpect(status().isOk())
                .andReturn();

        List<String> cookies = result.getResponse().getHeaders(HttpHeaders.SET_COOKIE);
        assertThat(cookies).hasSize(2);
        assertThat(cookies).anyMatch(cookie -> cookie.startsWith("access_token=access-jwt")
                && cookie.contains("HttpOnly") && cookie.contains("SameSite=Lax") && cookie.contains("Path=/;"));
        assertThat(cookies).anyMatch(cookie -> cookie.startsWith("refresh_token=refresh-raw")
                && cookie.contains("HttpOnly") && cookie.contains("Path=/api/auth"));
    }

    @Test
    void invalidCredentialsReturnUnauthorized() throws Exception {
        when(authService.login(any())).thenThrow(new InvalidCredentialsException());

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"ana@overlab.gg\",\"password\":\"password-123\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void refreshWithoutCookieReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")).andExpect(status().isBadRequest());
    }

    @Test
    void logoutClearsCookies() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/logout").cookie(new Cookie("refresh_token", "refresh-raw")))
                .andExpect(status().isNoContent())
                .andReturn();

        assertThat(result.getResponse().getHeaders(HttpHeaders.SET_COOKIE))
                .hasSize(2)
                .allMatch(cookie -> cookie.contains("Max-Age=0"));
    }

    private UserDto userDto() {
        return new UserDto(1L, "ana@overlab.gg", "Ana", UserRole.USER, AuthProvider.LOCAL, true);
    }
}
