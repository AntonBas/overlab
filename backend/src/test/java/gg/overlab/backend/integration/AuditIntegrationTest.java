package gg.overlab.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import gg.overlab.backend.audit.AuditAction;
import gg.overlab.backend.audit.AuditLog;
import gg.overlab.backend.audit.AuditLogRepository;
import gg.overlab.backend.config.security.JwtTokenProvider;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.hero.perk.PerkRepository;
import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRole;
import jakarta.servlet.http.Cookie;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@IntegrationTest
class AuditIntegrationTest {

    private static final long ADMIN_ID = 900003L;
    private static final String PERK_BODY = "{\"heroSlug\":\"audit-hero\",\"name\":\"Audit Perk\",\"slot\":\"MAJOR\","
            + "\"recommendation\":\"%s\"}";

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private HeroRepository heroRepository;

    @Autowired
    private PerkRepository perkRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    private MockMvc mockMvc;
    private Cookie adminCookie;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        User admin = new User();
        admin.setId(ADMIN_ID);
        admin.setEmail("audit-admin@overlab.test");
        admin.setRole(UserRole.ADMIN);
        adminCookie = new Cookie("access_token", tokenProvider.createAccessToken(admin));
        cleanUp();
        Hero hero = new Hero();
        hero.setSlug("audit-hero");
        hero.setName("Audit Hero");
        hero.setRole(HeroRole.SUPPORT);
        heroRepository.saveAndFlush(hero);
    }

    @AfterEach
    void cleanUp() {
        perkRepository.deleteAll(perkRepository.findAllByHeroSlugOrderBySlotAscNameAsc("audit-hero"));
        heroRepository.findBySlug("audit-hero").ifPresent(heroRepository::delete);
        auditLogRepository.deleteAll(auditLogRepository.findAll().stream()
                .filter(entry -> Long.valueOf(ADMIN_ID).equals(entry.getActorId())).toList());
    }

    @Test
    void adminChangesAreWrittenAsJsonAfterCommit() throws Exception {
        String created = mockMvc.perform(post("/api/admin/perks").cookie(adminCookie)
                        .contentType(MediaType.APPLICATION_JSON).content(PERK_BODY.formatted("RECOMMENDED")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.heroSlug").value("audit-hero"))
                .andReturn().getResponse().getContentAsString();
        String perkId = created.replaceAll(".*\"id\":(\\d+).*", "$1");

        mockMvc.perform(put("/api/admin/perks/" + perkId).cookie(adminCookie).contentType(MediaType.APPLICATION_JSON)
                        .content(PERK_BODY.formatted("AVOID")))
                .andExpect(status().isOk());

        await().atMost(Duration.ofSeconds(10)).untilAsserted(() ->
                assertThat(entriesOfAdmin()).extracting(AuditLog::getAction)
                        .containsExactlyInAnyOrder(AuditAction.CREATE, AuditAction.UPDATE));

        AuditLog create = entry(AuditAction.CREATE);
        assertThat(create.getActorRole()).isEqualTo("ADMIN");
        assertThat(create.getEntityType()).isEqualTo("Perk");
        assertThat(create.getEntityId()).isEqualTo(perkId);
        assertThat(create.getChanges()).containsEntry("name", "Audit Perk").containsEntry("slot", "MAJOR");

        AuditLog update = entry(AuditAction.UPDATE);
        assertThat(update.getChanges()).containsOnlyKeys("recommendation");
        assertThat(update.getChanges().get("recommendation")).isEqualTo(Map.of("from", "RECOMMENDED", "to", "AVOID"));
    }

    @Test
    void rejectedRequestLeavesNoAuditEntry() throws Exception {
        mockMvc.perform(post("/api/admin/perks").cookie(adminCookie).contentType(MediaType.APPLICATION_JSON)
                        .content(PERK_BODY.formatted("RECOMMENDED").replace("audit-hero", "missing-hero")))
                .andExpect(status().isNotFound());

        Thread.sleep(500);
        assertThat(entriesOfAdmin()).isEmpty();
    }

    private List<AuditLog> entriesOfAdmin() {
        return auditLogRepository.findAll().stream()
                .filter(entry -> Long.valueOf(ADMIN_ID).equals(entry.getActorId()))
                .toList();
    }

    private AuditLog entry(AuditAction action) {
        return entriesOfAdmin().stream().filter(entry -> entry.getAction() == action).findFirst().orElseThrow();
    }
}
