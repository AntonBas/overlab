package gg.overlab.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import gg.overlab.backend.config.security.JwtTokenProvider;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.hero.relation.HeroRelation;
import gg.overlab.backend.hero.relation.HeroRelationRepository;
import gg.overlab.backend.hero.relation.RelationType;
import gg.overlab.backend.hero.relation.feedback.RelationFeedbackService;
import gg.overlab.backend.hero.relation.feedback.RelationReportRepository;
import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRepository;
import gg.overlab.backend.user.UserRole;
import jakarta.servlet.http.Cookie;
import java.util.ArrayList;
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
class RelationFeedbackIntegrationTest {

    private static final String PREFIX = "feedback-test-";

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HeroRepository heroRepository;

    @Autowired
    private HeroRelationRepository relationRepository;

    @Autowired
    private RelationReportRepository reportRepository;

    @Autowired
    private JwtTokenProvider tokenProvider;

    private MockMvc mockMvc;
    private Cookie ownerCookie;
    private Cookie otherCookie;
    private Cookie adminCookie;
    private final List<Hero> heroes = new ArrayList<>();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        cleanUp();
        ownerCookie = cookieFor(saveUser("owner", UserRole.USER));
        otherCookie = cookieFor(saveUser("other", UserRole.USER));
        adminCookie = cookieFor(saveUser("admin", UserRole.ADMIN));
        for (int index = 0; index < 2; index++) {
            heroes.add(saveHero(index));
        }
        HeroRelation relation = new HeroRelation();
        relation.setHero(heroes.get(0));
        relation.setRelatedHero(heroes.get(1));
        relation.setType(RelationType.COUNTER);
        relation.setNote("tested note");
        relationRepository.saveAndFlush(relation);
    }

    @AfterEach
    void cleanUp() {
        for (String name : List.of("owner", "other", "admin")) {
            userRepository.findByEmailIgnoreCase(PREFIX + name + "@overlab.test").ifPresent(userRepository::delete);
        }
        heroRepository.findAll().stream().filter(hero -> hero.getSlug().startsWith(PREFIX))
                .forEach(heroRepository::delete);
        heroes.clear();
    }

    @Test
    void votesAreRememberedPerUserInEitherDirection() throws Exception {
        mockMvc.perform(json(put("/api/me/relation-votes"), voteBody(0, 1, "DOWN")).cookie(ownerCookie))
                .andExpect(status().isNoContent());
        mockMvc.perform(json(put("/api/me/relation-votes"), voteBody(1, 0, "UP")).cookie(ownerCookie))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/me/relation-votes").cookie(ownerCookie))
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].value").value("UP"));
        mockMvc.perform(get("/api/me/relation-votes").cookie(otherCookie))
                .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/api/me/relation-votes")).andExpect(status().isUnauthorized());
    }

    @Test
    void aVoteCanBeWithdrawn() throws Exception {
        mockMvc.perform(json(put("/api/me/relation-votes"), voteBody(0, 1, "UP")).cookie(ownerCookie))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/me/relation-votes")
                        .param("heroSlug", heroes.get(0).getSlug())
                        .param("relatedHeroSlug", heroes.get(1).getSlug())
                        .param("type", "COUNTER")
                        .cookie(ownerCookie))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/me/relation-votes").cookie(ownerCookie))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void votingOnAnUnknownRelationIsNotFound() throws Exception {
        mockMvc.perform(json(put("/api/me/relation-votes"), voteBody(0, 1, "UP").replace("COUNTER", "SYNERGY"))
                        .cookie(ownerCookie))
                .andExpect(status().isNotFound());
    }

    @Test
    void reportsNeedAMeaningfulMessageAndOneOpenReportPerRelation() throws Exception {
        mockMvc.perform(json(post("/api/me/relation-reports"), reportBody(0, 1, "short")).cookie(ownerCookie))
                .andExpect(status().isBadRequest());
        mockMvc.perform(json(post("/api/me/relation-reports"), reportBody(0, 1, "This counter is outdated"))
                        .cookie(ownerCookie))
                .andExpect(status().isCreated());
        mockMvc.perform(json(post("/api/me/relation-reports"), reportBody(1, 0, "Another thing to say here"))
                        .cookie(ownerCookie))
                .andExpect(status().isConflict());
        mockMvc.perform(json(post("/api/me/relation-reports"), reportBody(0, 1, "Seen the same problem too"))
                        .cookie(otherCookie))
                .andExpect(status().isCreated());
    }

    @Test
    void openReportsPerUserAreCapped() throws Exception {
        for (int index = 0; index < RelationFeedbackService.MAX_OPEN_REPORTS_PER_USER; index++) {
            Hero extra = saveHero(10 + index);
            heroes.add(extra);
            HeroRelation relation = new HeroRelation();
            relation.setHero(heroes.get(0));
            relation.setRelatedHero(extra);
            relation.setType(RelationType.SYNERGY);
            relationRepository.saveAndFlush(relation);
            mockMvc.perform(json(post("/api/me/relation-reports"),
                            reportBody(0, heroes.size() - 1, "Synergy does not work, " + index)
                                    .replace("COUNTER", "SYNERGY")).cookie(ownerCookie))
                    .andExpect(status().isCreated());
        }
        mockMvc.perform(json(post("/api/me/relation-reports"), reportBody(0, 1, "One report too many here"))
                        .cookie(ownerCookie))
                .andExpect(status().isBadRequest());
    }

    @Test
    void adminSeesReportsAndVoteSummaryAndResolvesReports() throws Exception {
        mockMvc.perform(json(post("/api/me/relation-reports"), reportBody(0, 1, "This counter is outdated"))
                        .cookie(ownerCookie))
                .andExpect(status().isCreated());
        mockMvc.perform(json(put("/api/me/relation-votes"), voteBody(0, 1, "DOWN")).cookie(ownerCookie));
        mockMvc.perform(json(put("/api/me/relation-votes"), voteBody(0, 1, "DOWN")).cookie(otherCookie));

        mockMvc.perform(get("/api/admin/relation-reports").cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.heroSlug=='" + heroes.get(0).getSlug() + "')].message")
                        .value("This counter is outdated"))
                .andExpect(jsonPath("$[?(@.heroSlug=='" + heroes.get(0).getSlug() + "')].reporterName")
                        .value("Feedback owner"));
        mockMvc.perform(get("/api/admin/relation-votes/summary").cookie(adminCookie))
                .andExpect(jsonPath("$[?(@.heroSlug=='" + heroes.get(0).getSlug() + "')].down").value(2));

        Long ownerId = userRepository.findByEmailIgnoreCase(PREFIX + "owner@overlab.test").orElseThrow().getId();
        Long reportId = reportRepository.findAllByUserIdOrderByIdAsc(ownerId).get(0).getId();
        mockMvc.perform(json(put("/api/admin/relation-reports/" + reportId + "/status"),
                        "{\"status\":\"ACCEPTED\"}").cookie(adminCookie))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/admin/relation-reports").cookie(adminCookie))
                .andExpect(jsonPath("$[?(@.id==" + reportId + ")]").isEmpty());
        mockMvc.perform(get("/api/admin/relation-reports").param("status", "ACCEPTED").cookie(adminCookie))
                .andExpect(jsonPath("$[?(@.id==" + reportId + ")].resolvedAt").isNotEmpty());
    }

    @Test
    void feedbackEndpointsAreClosedToUsersAndGuests() throws Exception {
        mockMvc.perform(get("/api/admin/relation-reports").cookie(ownerCookie)).andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/relation-votes/summary").cookie(ownerCookie))
                .andExpect(status().isForbidden());
        mockMvc.perform(json(post("/api/me/relation-reports"), reportBody(0, 1, "Anonymous complaint here")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deletingTheAccountRemovesItsFeedback() throws Exception {
        mockMvc.perform(json(put("/api/me/relation-votes"), voteBody(0, 1, "UP")).cookie(ownerCookie));
        mockMvc.perform(json(post("/api/me/relation-reports"), reportBody(0, 1, "This counter is outdated"))
                .cookie(ownerCookie));
        User owner = userRepository.findByEmailIgnoreCase(PREFIX + "owner@overlab.test").orElseThrow();

        userRepository.delete(owner);
        userRepository.flush();

        assertThat(reportRepository.findAllByUserIdOrderByIdAsc(owner.getId())).isEmpty();
    }

    private String voteBody(int hero, int related, String value) {
        return "{\"heroSlug\":\"" + heroes.get(hero).getSlug() + "\",\"relatedHeroSlug\":\""
                + heroes.get(related).getSlug() + "\",\"type\":\"COUNTER\",\"value\":\"" + value + "\"}";
    }

    private String reportBody(int hero, int related, String message) {
        return "{\"heroSlug\":\"" + heroes.get(hero).getSlug() + "\",\"relatedHeroSlug\":\""
                + heroes.get(related).getSlug() + "\",\"type\":\"COUNTER\",\"message\":\"" + message + "\"}";
    }

    private User saveUser(String name, UserRole role) {
        User user = new User();
        user.setEmail(PREFIX + name + "@overlab.test");
        user.setDisplayName("Feedback " + name);
        user.setEmailVerified(true);
        user.setRole(role);
        return userRepository.saveAndFlush(user);
    }

    private Hero saveHero(int index) {
        Hero hero = new Hero();
        hero.setSlug(PREFIX + index);
        hero.setName("Feedback Hero " + index);
        hero.setRole(HeroRole.DAMAGE);
        return heroRepository.saveAndFlush(hero);
    }

    private Cookie cookieFor(User user) {
        return new Cookie("access_token", tokenProvider.createAccessToken(user));
    }

    private MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder builder, String body) {
        return builder.contentType(MediaType.APPLICATION_JSON).content(body);
    }
}
