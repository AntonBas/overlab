package gg.overlab.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import gg.overlab.backend.config.security.JwtTokenProvider;
import gg.overlab.backend.feedback.FeedbackService;
import gg.overlab.backend.feedback.SiteFeedback;
import gg.overlab.backend.feedback.SiteFeedbackRepository;
import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRepository;
import gg.overlab.backend.user.UserRole;
import jakarta.servlet.http.Cookie;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@IntegrationTest
class FeedbackIntegrationTest {

    private static final String PREFIX = "site-feedback-test-";
    private static final String MESSAGE = "The win rate here looks outdated";

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SiteFeedbackRepository feedbackRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private MockMvc mockMvc;
    private Cookie userCookie;
    private Cookie adminCookie;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        cleanUp();
        userCookie = cookieFor(saveUser("user", UserRole.USER));
        adminCookie = cookieFor(saveUser("admin", UserRole.ADMIN));
    }

    @AfterEach
    void cleanUp() {
        feedbackRepository.deleteAll(feedbackRepository.findAll().stream()
                .filter(feedback -> feedback.getMessage().startsWith(PREFIX)).toList());
        for (String name : List.of("user", "admin")) {
            userRepository.findByEmailIgnoreCase(PREFIX + name + "@overlab.test").ifPresent(userRepository::delete);
        }
    }

    @Test
    void anonymousVisitorsCanSendFeedback() throws Exception {
        mockMvc.perform(json(post("/api/feedback"), body("TYPO", PREFIX + "Typo in the Ana description", "/heroes/ana")))
                .andExpect(status().isCreated());

        SiteFeedback saved = latest();
        assertThat(saved.getUserId()).isNull();
        assertThat(saved.getPagePath()).isEqualTo("/heroes/ana");
    }

    @Test
    void signedInVisitorsAreRemembered() throws Exception {
        mockMvc.perform(json(post("/api/feedback"), body("BUG", PREFIX + "The page is blank", "/stats"))
                        .cookie(userCookie))
                .andExpect(status().isCreated());

        assertThat(latest().getUserId()).isNotNull();
    }

    @Test
    void messagesAreValidated() throws Exception {
        mockMvc.perform(json(post("/api/feedback"), body("BUG", "short", "/stats")))
                .andExpect(status().isBadRequest());
        mockMvc.perform(json(post("/api/feedback"), "{\"type\":\"NOPE\",\"message\":\"" + MESSAGE + "\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(json(post("/api/feedback"), "{\"message\":\"" + MESSAGE + "\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void onlySitePathsAreKept() throws Exception {
        mockMvc.perform(json(post("/api/feedback"), body("OTHER", PREFIX + "Check this page", "https://evil.test")))
                .andExpect(status().isCreated());

        assertThat(latest().getPagePath()).isNull();
    }

    @Test
    void openMessagesPerUserAreCapped() throws Exception {
        for (int index = 0; index < FeedbackService.MAX_OPEN_PER_USER; index++) {
            mockMvc.perform(json(post("/api/feedback"), body("OTHER", PREFIX + "Message number " + index, null))
                            .cookie(userCookie))
                    .andExpect(status().isCreated());
        }
        mockMvc.perform(json(post("/api/feedback"), body("OTHER", PREFIX + "One message too many", null))
                        .cookie(userCookie))
                .andExpect(status().isBadRequest());
    }

    @Test
    void adminReviewsAndResolvesMessages() throws Exception {
        mockMvc.perform(json(post("/api/feedback"), body("INACCURACY", PREFIX + "Zarya counter is wrong", "/heroes/ana"))
                        .cookie(userCookie));
        Long id = latest().getId();

        mockMvc.perform(get("/api/admin/feedback").cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==" + id + ")].authorName").value("Feedback user"));
        mockMvc.perform(json(put("/api/admin/feedback/" + id + "/status"), "{\"status\":\"RESOLVED\"}")
                        .cookie(adminCookie))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/admin/feedback").cookie(adminCookie))
                .andExpect(jsonPath("$[?(@.id==" + id + ")]").isEmpty());
        mockMvc.perform(get("/api/admin/feedback").param("status", "RESOLVED").cookie(adminCookie))
                .andExpect(jsonPath("$[?(@.id==" + id + ")].resolvedAt").isNotEmpty());
    }

    @Test
    void adminEndpointsAreClosedToUsersAndGuests() throws Exception {
        mockMvc.perform(get("/api/admin/feedback").cookie(userCookie)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/feedback")).andExpect(status().isUnauthorized());
    }

    @Test
    void deletingTheAccountKeepsTheMessageButForgetsTheAuthor() throws Exception {
        mockMvc.perform(json(post("/api/feedback"), body("BUG", PREFIX + "Something is broken", "/stats"))
                        .cookie(userCookie));
        Long id = latest().getId();
        User user = userRepository.findByEmailIgnoreCase(PREFIX + "user@overlab.test").orElseThrow();

        userRepository.delete(user);
        userRepository.flush();

        assertThat(feedbackRepository.findById(id).orElseThrow().getUserId()).isNull();
    }

    private SiteFeedback latest() {
        return feedbackRepository.findAll().stream()
                .filter(feedback -> feedback.getMessage().startsWith(PREFIX))
                .reduce((first, second) -> second).orElseThrow();
    }

    private String body(String type, String message, String path) {
        String pagePath = path == null ? "" : ",\"pagePath\":\"" + path + "\"";
        return "{\"type\":\"" + type + "\",\"message\":\"" + message + "\"" + pagePath + "}";
    }

    private User saveUser(String name, UserRole role) {
        User user = new User();
        user.setEmail(PREFIX + name + "@overlab.test");
        user.setDisplayName("Feedback " + name);
        user.setEmailVerified(true);
        user.setRole(role);
        return userRepository.saveAndFlush(user);
    }

    private Cookie cookieFor(User user) {
        return new Cookie("access_token", tokenProvider.createAccessToken(user));
    }

    private MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder builder, String body) {
        return builder.contentType(MediaType.APPLICATION_JSON).content(body);
    }
}
