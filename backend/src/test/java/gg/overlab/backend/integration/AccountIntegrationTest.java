package gg.overlab.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import gg.overlab.backend.config.security.JwtTokenProvider;
import gg.overlab.backend.user.AuthProvider;
import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRepository;
import gg.overlab.backend.user.UserRole;
import gg.overlab.backend.user.token.UserTokenService;
import gg.overlab.backend.user.token.UserTokenType;
import java.time.Duration;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@IntegrationTest
class AccountIntegrationTest {

    private static final String EMAIL = "account-test@overlab.test";
    private static final String OTHER_EMAIL = "account-other@overlab.test";
    private static final String GOOGLE_EMAIL = "account-google@overlab.test";
    private static final String ADMIN_EMAIL = "account-admin@overlab.test";
    private static final String PASSWORD = "account-password-1";

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private UserTokenService userTokenService;

    private MockMvc mockMvc;
    private User user;
    private Cookie userCookie;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        cleanUp();
        user = saveUser(EMAIL, UserRole.USER, AuthProvider.LOCAL);
        userCookie = new Cookie("access_token", tokenProvider.createAccessToken(user));
    }

    @AfterEach
    void cleanUp() {
        for (String email : new String[] {EMAIL, OTHER_EMAIL, GOOGLE_EMAIL, ADMIN_EMAIL}) {
            userRepository.findByEmailIgnoreCase(email).ifPresent(userRepository::delete);
        }
    }

    @Test
    void profileCanBeRenamed() throws Exception {
        mockMvc.perform(json(put("/api/me/profile"), "{\"displayName\":\"New Name\"}").cookie(userCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("New Name"));
    }

    @Test
    void emailChangeTokenAppliesPendingEmailOnce() throws Exception {
        user.setPendingEmail(OTHER_EMAIL);
        userRepository.saveAndFlush(user);
        String token = userTokenService.issue(user, UserTokenType.EMAIL_CHANGE, Duration.ofHours(1));

        mockMvc.perform(json(post("/api/auth/verify-email"), "{\"token\":\"" + token + "\"}"))
                .andExpect(status().isNoContent());

        User changed = userRepository.findById(user.getId()).orElseThrow();
        assertThat(changed.getEmail()).isEqualTo(OTHER_EMAIL);
        assertThat(changed.getPendingEmail()).isNull();
        mockMvc.perform(json(post("/api/auth/verify-email"), "{\"token\":\"" + token + "\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void adminTokenStopsWorkingAfterTheAdminIsDisabledOrDemoted() throws Exception {
        User admin = saveUser(ADMIN_EMAIL, UserRole.ADMIN, AuthProvider.LOCAL);
        Cookie adminCookie = new Cookie("access_token", tokenProvider.createAccessToken(admin));
        mockMvc.perform(get("/api/admin/users").cookie(adminCookie)).andExpect(status().isOk());

        admin.setEnabled(false);
        userRepository.saveAndFlush(admin);
        mockMvc.perform(get("/api/admin/users").cookie(adminCookie)).andExpect(status().isUnauthorized());

        admin.setEnabled(true);
        admin.setRole(UserRole.USER);
        userRepository.saveAndFlush(admin);
        mockMvc.perform(get("/api/admin/users").cookie(adminCookie)).andExpect(status().isUnauthorized());
    }

    @Test
    void crossOriginStateChangingRequestsFromForeignOriginsAreRejected() throws Exception {
        mockMvc.perform(post("/api/auth/logout").header("Origin", "https://evil.example").cookie(userCookie))
                .andExpect(status().isForbidden());
    }

    @Test
    void loginIsLockedAfterRepeatedFailures() throws Exception {
        String body = "{\"email\":\"" + EMAIL + "\",\"password\":\"wrong-password-1\"}";
        for (int attempt = 0; attempt < 10; attempt++) {
            String address = "10.9.8." + (attempt + 1);
            mockMvc.perform(json(post("/api/auth/login"), body).with(request -> {
                request.setRemoteAddr(address);
                return request;
            })).andExpect(status().isUnauthorized());
        }

        mockMvc.perform(json(post("/api/auth/login"),
                        "{\"email\":\"" + EMAIL + "\",\"password\":\"" + PASSWORD + "\"}")
                        .with(request -> {
                            request.setRemoteAddr("10.9.9.9");
                            return request;
                        }))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void passwordChangeNeedsTheCurrentPassword() throws Exception {
        mockMvc.perform(json(post("/api/me/password"),
                        "{\"currentPassword\":\"wrong-password\",\"newPassword\":\"brand-new-password\"}")
                        .cookie(userCookie))
                .andExpect(status().isBadRequest());

        mockMvc.perform(json(post("/api/me/password"),
                        "{\"currentPassword\":\"" + PASSWORD + "\",\"newPassword\":\"brand-new-password\"}")
                        .cookie(userCookie))
                .andExpect(status().isOk());

        User reloaded = userRepository.findById(user.getId()).orElseThrow();
        assertThat(passwordEncoder.matches("brand-new-password", reloaded.getPasswordHash())).isTrue();
    }

    @Test
    void googleAccountsHaveNoPasswordToChange() throws Exception {
        User google = saveUser(GOOGLE_EMAIL, UserRole.USER, AuthProvider.GOOGLE);
        Cookie cookie = new Cookie("access_token", tokenProvider.createAccessToken(google));

        mockMvc.perform(json(post("/api/me/password"),
                        "{\"currentPassword\":\"anything-123\",\"newPassword\":\"brand-new-password\"}").cookie(cookie))
                .andExpect(status().isBadRequest());
    }

    @Test
    void emailChangeIsPendingUntilConfirmedAndRejectsTakenAddresses() throws Exception {
        saveUser(OTHER_EMAIL, UserRole.USER, AuthProvider.LOCAL);

        mockMvc.perform(json(post("/api/me/email"),
                        "{\"newEmail\":\"" + OTHER_EMAIL + "\",\"currentPassword\":\"" + PASSWORD + "\"}")
                        .cookie(userCookie))
                .andExpect(status().isConflict());

        mockMvc.perform(json(post("/api/me/email"),
                        "{\"newEmail\":\"Account-New@overlab.test\",\"currentPassword\":\"" + PASSWORD + "\"}")
                        .cookie(userCookie))
                .andExpect(status().isNoContent());

        User reloaded = userRepository.findById(user.getId()).orElseThrow();
        assertThat(reloaded.getEmail()).isEqualTo(EMAIL);
        assertThat(reloaded.getPendingEmail()).isEqualTo("account-new@overlab.test");
    }

    @Test
    void exportContainsOnlyTheOwnProfile() throws Exception {
        mockMvc.perform(get("/api/me/export").cookie(userCookie))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.email").value(EMAIL))
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        mockMvc.perform(get("/api/me/export")).andExpect(status().isUnauthorized());
    }

    @Test
    void deleteNeedsThePasswordAndRemovesTheUser() throws Exception {
        mockMvc.perform(json(delete("/api/me"), "{\"password\":\"wrong-password\"}").cookie(userCookie))
                .andExpect(status().isBadRequest());
        assertThat(userRepository.existsById(user.getId())).isTrue();

        mockMvc.perform(json(delete("/api/me"), "{\"password\":\"" + PASSWORD + "\"}").cookie(userCookie))
                .andExpect(status().isNoContent());
        assertThat(userRepository.existsById(user.getId())).isFalse();
    }

    @Test
    void regularUsersCannotBlockAccountsAndAdminsCannotBlockThemselves() throws Exception {
        User admin = saveUser(ADMIN_EMAIL, UserRole.ADMIN, AuthProvider.LOCAL);
        Cookie adminCookie = new Cookie("access_token", tokenProvider.createAccessToken(admin));

        mockMvc.perform(json(put("/api/admin/users/" + admin.getId() + "/enabled"), "{\"enabled\":false}")
                        .cookie(userCookie))
                .andExpect(status().isForbidden());
        mockMvc.perform(json(put("/api/admin/users/" + admin.getId() + "/enabled"), "{\"enabled\":false}")
                        .cookie(adminCookie))
                .andExpect(status().isBadRequest());
    }

    @Test
    void blockedUsersCannotSignInUntilUnblocked() throws Exception {
        User admin = saveUser(ADMIN_EMAIL, UserRole.ADMIN, AuthProvider.LOCAL);
        Cookie adminCookie = new Cookie("access_token", tokenProvider.createAccessToken(admin));
        String credentials = "{\"email\":\"" + EMAIL + "\",\"password\":\"" + PASSWORD + "\"}";

        mockMvc.perform(json(put("/api/admin/users/" + user.getId() + "/enabled"), "{\"enabled\":false}")
                        .cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));
        mockMvc.perform(json(post("/api/auth/login"), credentials)).andExpect(status().isUnauthorized());

        mockMvc.perform(json(put("/api/admin/users/" + user.getId() + "/enabled"), "{\"enabled\":true}")
                        .cookie(adminCookie))
                .andExpect(status().isOk());
        mockMvc.perform(json(post("/api/auth/login"), credentials)).andExpect(status().isOk());
    }

    @Test
    void adminCanChangeRolesButNotItsOwnAndRegularUsersCannot() throws Exception {
        User admin = saveUser(ADMIN_EMAIL, UserRole.ADMIN, AuthProvider.LOCAL);
        Cookie adminCookie = new Cookie("access_token", tokenProvider.createAccessToken(admin));

        mockMvc.perform(json(put("/api/admin/users/" + user.getId() + "/role"), "{\"role\":\"ADMIN\"}")
                        .cookie(userCookie))
                .andExpect(status().isForbidden());
        mockMvc.perform(json(put("/api/admin/users/" + admin.getId() + "/role"), "{\"role\":\"USER\"}")
                        .cookie(adminCookie))
                .andExpect(status().isBadRequest());
        mockMvc.perform(json(put("/api/admin/users/" + user.getId() + "/role"), "{\"role\":\"ADMIN\"}")
                        .cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));
        assertThat(userRepository.findById(user.getId()).orElseThrow().getRole()).isEqualTo(UserRole.ADMIN);
        mockMvc.perform(json(put("/api/admin/users/" + user.getId() + "/role"), "{\"role\":\"USER\"}")
                        .cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void adminCanSearchUsers() throws Exception {
        User admin = saveUser(ADMIN_EMAIL, UserRole.ADMIN, AuthProvider.LOCAL);
        Cookie adminCookie = new Cookie("access_token", tokenProvider.createAccessToken(admin));

        mockMvc.perform(get("/api/admin/users").param("q", "account-test").cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].email").value(EMAIL));
    }

    @Test
    void userSearchTreatsWildcardCharactersLiterally() throws Exception {
        User admin = saveUser(ADMIN_EMAIL, UserRole.ADMIN, AuthProvider.LOCAL);
        Cookie adminCookie = new Cookie("access_token", tokenProvider.createAccessToken(admin));

        mockMvc.perform(get("/api/admin/users").param("q", "account_test").cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0));
        mockMvc.perform(get("/api/admin/users").param("q", "%").cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0));
        mockMvc.perform(get("/api/admin/users").param("q", "account-test").cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].email").value(EMAIL));
    }

    @Test
    void adminCanFilterAndSortUsers() throws Exception {
        User admin = saveUser(ADMIN_EMAIL, UserRole.ADMIN, AuthProvider.LOCAL);
        Cookie adminCookie = new Cookie("access_token", tokenProvider.createAccessToken(admin));
        User google = saveUser(GOOGLE_EMAIL, UserRole.USER, AuthProvider.GOOGLE);
        google.setEnabled(false);
        userRepository.saveAndFlush(google);

        mockMvc.perform(get("/api/admin/users").param("q", "account-").param("role", "ADMIN").cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].email").value(ADMIN_EMAIL));
        mockMvc.perform(get("/api/admin/users").param("q", "account-").param("provider", "GOOGLE")
                        .cookie(adminCookie))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].email").value(GOOGLE_EMAIL));
        mockMvc.perform(get("/api/admin/users").param("q", "account-").param("enabled", "false")
                        .cookie(adminCookie))
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].email").value(GOOGLE_EMAIL));
        mockMvc.perform(get("/api/admin/users").param("q", "account-").param("emailVerified", "false")
                        .cookie(adminCookie))
                .andExpect(jsonPath("$.content.length()").value(0));
        mockMvc.perform(get("/api/admin/users").param("q", "account-").param("sort", "email")
                        .param("direction", "asc").cookie(adminCookie))
                .andExpect(jsonPath("$.content[0].email").value(ADMIN_EMAIL))
                .andExpect(jsonPath("$.content[2].email").value(EMAIL));
        mockMvc.perform(get("/api/admin/users").param("q", "account-").param("sort", "password_hash")
                        .cookie(adminCookie))
                .andExpect(status().isOk());
    }

    private User saveUser(String email, UserRole role, AuthProvider provider) {
        User account = new User();
        account.setEmail(email);
        account.setDisplayName("Account Test");
        account.setRole(role);
        account.setProvider(provider);
        account.setEmailVerified(true);
        if (provider == AuthProvider.LOCAL) {
            account.setPasswordHash(passwordEncoder.encode(PASSWORD));
        } else {
            account.setProviderId("google-" + email);
        }
        return userRepository.saveAndFlush(account);
    }

    private MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder builder, String body) {
        return builder.contentType(MediaType.APPLICATION_JSON).content(body);
    }
}
