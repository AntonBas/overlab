package gg.overlab.backend.integration;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import gg.overlab.backend.config.security.JwtTokenProvider;
import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRole;
import jakarta.servlet.http.Cookie;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@IntegrationTest
class SecurityMatrixIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private MockMvc mockMvc;
    private Cookie userCookie;
    private Cookie adminCookie;

    static Stream<Arguments> endpoints() {
        return Stream.of(
                Arguments.of(HttpMethod.GET, "/api/heroes", 200, 200, 200),
                Arguments.of(HttpMethod.GET, "/api/maps", 200, 200, 200),
                Arguments.of(HttpMethod.GET, "/api/patches", 200, 200, 200),
                Arguments.of(HttpMethod.GET, "/api/guides", 200, 200, 200),
                Arguments.of(HttpMethod.GET, "/actuator/health", 200, 200, 200),
                Arguments.of(HttpMethod.GET, "/api/auth/me", 401, 404, 404),
                Arguments.of(HttpMethod.GET, "/v3/api-docs", 401, 403, 200),
                Arguments.of(HttpMethod.GET, "/api/admin/audit", 401, 403, 200),
                Arguments.of(HttpMethod.GET, "/api/admin/guides", 401, 403, 200),
                Arguments.of(HttpMethod.GET, "/api/admin/heroes", 401, 403, 200),
                Arguments.of(HttpMethod.GET, "/api/admin/hero-relations", 401, 403, 200),
                Arguments.of(HttpMethod.GET, "/api/admin/collector/jobs", 401, 403, 200),
                Arguments.of(HttpMethod.GET, "/api/admin/collector/runs", 401, 403, 200),
                Arguments.of(HttpMethod.POST, "/api/admin/perks", 401, 403, 400),
                Arguments.of(HttpMethod.POST, "/api/admin/guides", 401, 403, 400),
                Arguments.of(HttpMethod.POST, "/api/admin/patches", 401, 403, 400),
                Arguments.of(HttpMethod.POST, "/api/admin/hero-relations", 401, 403, 400),
                Arguments.of(HttpMethod.POST, "/api/admin/collector/jobs/missing/run", 401, 403, 404),
                Arguments.of(HttpMethod.PUT, "/api/admin/heroes/missing", 401, 403, 400),
                Arguments.of(HttpMethod.DELETE, "/api/admin/perks/999999", 401, 403, 404));
    }

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        userCookie = new Cookie("access_token", tokenProvider.createAccessToken(account(900001L, UserRole.USER)));
        adminCookie = new Cookie("access_token", tokenProvider.createAccessToken(account(900002L, UserRole.ADMIN)));
    }

    @ParameterizedTest(name = "{0} {1}: anonymous {2}, user {3}, admin {4}")
    @MethodSource("endpoints")
    void rolesSeeTheExpectedStatus(HttpMethod method, String path, int anonymous, int user, int admin) throws Exception {
        mockMvc.perform(request(method, path).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().is(anonymous));
        mockMvc.perform(request(method, path).contentType(MediaType.APPLICATION_JSON).content("{}").cookie(userCookie))
                .andExpect(status().is(user));
        mockMvc.perform(request(method, path).contentType(MediaType.APPLICATION_JSON).content("{}").cookie(adminCookie))
                .andExpect(status().is(admin));
    }

    private User account(long id, UserRole role) {
        User user = new User();
        user.setId(id);
        user.setEmail("matrix-" + id + "@overlab.test");
        user.setRole(role);
        return user;
    }
}
