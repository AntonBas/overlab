package gg.overlab.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@IntegrationTest
class AuthFlowIntegrationTest {

    private static final String EMAIL = "flow-test@overlab.test";
    private static final String PASSWORD = "flow-test-password";

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        userRepository.findByEmailIgnoreCase(EMAIL).ifPresent(userRepository::delete);
    }

    @AfterEach
    void cleanUp() {
        userRepository.findByEmailIgnoreCase(EMAIL).ifPresent(userRepository::delete);
    }

    @Test
    void registerVerifyLoginRefreshAndLogout() throws Exception {
        mockMvc.perform(json(post("/api/auth/register"), "{\"email\":\"" + EMAIL + "\",\"password\":\"" + PASSWORD
                        + "\",\"displayName\":\"Flow Test\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.emailVerified").value(false));

        mockMvc.perform(json(post("/api/auth/register"), "{\"email\":\"" + EMAIL.toUpperCase() + "\",\"password\":\""
                        + PASSWORD + "\",\"displayName\":\"Flow Test\"}"))
                .andExpect(status().isConflict());

        mockMvc.perform(json(post("/api/auth/login"), credentials())).andExpect(status().isForbidden());

        User user = userRepository.findByEmailIgnoreCase(EMAIL).orElseThrow();
        assertThat(user.getPasswordHash()).isNotEqualTo(PASSWORD).startsWith("$2");
        user.setEmailVerified(true);
        userRepository.saveAndFlush(user);

        MvcResult login = mockMvc.perform(json(post("/api/auth/login"), credentials()))
                .andExpect(status().isOk())
                .andReturn();
        Cookie access = login.getResponse().getCookie("access_token");
        Cookie refresh = login.getResponse().getCookie("refresh_token");
        assertThat(access).isNotNull();
        assertThat(access.isHttpOnly()).isTrue();
        assertThat(refresh).isNotNull();
        assertThat(refresh.getPath()).isEqualTo("/api/auth");

        mockMvc.perform(get("/api/auth/me").cookie(access))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(EMAIL));

        MvcResult refreshed = mockMvc.perform(post("/api/auth/refresh").cookie(refresh))
                .andExpect(status().isOk())
                .andReturn();
        Cookie newRefresh = refreshed.getResponse().getCookie("refresh_token");
        assertThat(newRefresh.getValue()).isNotEqualTo(refresh.getValue());

        mockMvc.perform(post("/api/auth/refresh").cookie(refresh)).andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/auth/logout").cookie(newRefresh)).andExpect(status().isNoContent());
        mockMvc.perform(post("/api/auth/refresh").cookie(newRefresh)).andExpect(status().isBadRequest());
    }

    @Test
    void wrongPasswordAndUnknownUserGetTheSameAnswer() throws Exception {
        mockMvc.perform(json(post("/api/auth/register"), "{\"email\":\"" + EMAIL + "\",\"password\":\"" + PASSWORD
                + "\",\"displayName\":\"Flow Test\"}")).andExpect(status().isCreated());
        User user = userRepository.findByEmailIgnoreCase(EMAIL).orElseThrow();
        user.setEmailVerified(true);
        userRepository.saveAndFlush(user);

        mockMvc.perform(json(post("/api/auth/login"), "{\"email\":\"" + EMAIL + "\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
        mockMvc.perform(json(post("/api/auth/login"), "{\"email\":\"nobody@overlab.test\",\"password\":\"whatever-123\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    private String credentials() {
        return "{\"email\":\"" + EMAIL + "\",\"password\":\"" + PASSWORD + "\"}";
    }

    private MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder builder, String body) {
        return builder.contentType(MediaType.APPLICATION_JSON).content(body);
    }
}
