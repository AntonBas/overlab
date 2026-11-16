package gg.overlab.backend.integration;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@IntegrationTest
@TestPropertySource(properties = {"app.rate-limit.api-per-minute=3", "app.rate-limit.stats-per-minute=5"})
class ApiHardeningIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void publicApiIsLimitedPerAddressWithApiErrorBody() throws Exception {
        RequestPostProcessor client = uniqueClient();
        for (int attempt = 0; attempt < 3; attempt++) {
            mockMvc.perform(get("/api/heroes").with(client)).andExpect(status().isOk());
        }
        mockMvc.perform(get("/api/heroes").with(client))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.statusCode").value(429))
                .andExpect(jsonPath("$.path").value("/api/heroes"));
        mockMvc.perform(get("/api/heroes").with(uniqueClient())).andExpect(status().isOk());
    }

    @Test
    void statsHaveTheirOwnHigherLimit() throws Exception {
        RequestPostProcessor client = uniqueClient();
        for (int attempt = 0; attempt < 3; attempt++) {
            mockMvc.perform(get("/api/heroes").with(client)).andExpect(status().isOk());
        }
        mockMvc.perform(get("/api/stats").with(client)).andExpect(status().is(org.hamcrest.Matchers.not(429)));
        mockMvc.perform(get("/api/stats").with(client)).andExpect(status().is(org.hamcrest.Matchers.not(429)));
    }

    @Test
    void statsAreLimitedOnceTheirOwnLimitIsExceeded() throws Exception {
        RequestPostProcessor client = uniqueClient();
        for (int attempt = 0; attempt < 5; attempt++) {
            mockMvc.perform(get("/api/stats").with(client)).andExpect(status().is(org.hamcrest.Matchers.not(429)));
        }
        mockMvc.perform(get("/api/stats").with(client)).andExpect(status().isTooManyRequests());
    }

    @Test
    void publicResponsesAreCacheableAndAuthResponsesAreNot() throws Exception {
        mockMvc.perform(get("/api/maps").with(uniqueClient()))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, "public, max-age=60, stale-while-revalidate=300"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
        mockMvc.perform(get("/api/auth/me").with(uniqueClient()))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, org.hamcrest.Matchers.containsString("no-store")));
    }

    @Test
    void corsAllowsOnlyTheConfiguredOrigin() throws Exception {
        mockMvc.perform(options("/api/heroes")
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                        .with(uniqueClient()))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"));
        mockMvc.perform(options("/api/heroes")
                        .header(HttpHeaders.ORIGIN, "https://evil.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                        .with(uniqueClient()))
                .andExpect(status().isForbidden());
    }

    @Test
    void sameOriginWritesAreNotRejectedByCors() throws Exception {
        for (String method : new String[] {"PUT", "DELETE", "POST"}) {
            mockMvc.perform(options("/api/me/profile")
                            .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                            .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, method)
                            .with(uniqueClient()))
                    .andExpect(status().isOk());
        }
    }

    private RequestPostProcessor uniqueClient() {
        String address = "198.51." + Math.abs(UUID.randomUUID().hashCode() % 250) + "."
                + Math.abs(UUID.randomUUID().hashCode() % 250);
        return request -> {
            request.setRemoteAddr(address);
            return request;
        };
    }
}
