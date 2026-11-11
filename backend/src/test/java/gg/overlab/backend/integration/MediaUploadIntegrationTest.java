package gg.overlab.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.head;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import gg.overlab.backend.config.security.JwtTokenProvider;
import gg.overlab.backend.media.MediaProperties;
import gg.overlab.backend.user.AuthProvider;
import gg.overlab.backend.user.User;
import gg.overlab.backend.user.UserRepository;
import gg.overlab.backend.user.UserRole;
import jakarta.servlet.http.Cookie;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@IntegrationTest
class MediaUploadIntegrationTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 13, 10, 26, 10, 1, 2, 3};

    @Autowired
    private WebApplicationContext context;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private MediaProperties mediaProperties;

    @Autowired
    private UserRepository userRepository;

    private User admin;

    private MockMvc mockMvc;
    private Cookie adminCookie;
    private Cookie userCookie;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        admin = new User();
        admin.setEmail("media-admin@overlab.test");
        admin.setDisplayName("Media Admin");
        admin.setRole(UserRole.ADMIN);
        admin.setProvider(AuthProvider.LOCAL);
        admin.setEmailVerified(true);
        admin = userRepository.saveAndFlush(admin);
        adminCookie = new Cookie("access_token", tokenProvider.createAccessToken(admin));
        userCookie = new Cookie("access_token", tokenProvider.createAccessToken(account(910001L, UserRole.USER)));
    }

    @AfterEach
    void removeAdmin() {
        userRepository.deleteById(admin.getId());
    }

    @Test
    void adminUploadsAMapImageThatIsThenServedPublicly() throws Exception {
        MvcResult result = mockMvc.perform(upload("/api/admin/maps/busan/image", "map.png", PNG).cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrl").value(org.hamcrest.Matchers.startsWith("/media/maps/busan-")))
                .andReturn();
        String url = JsonPath.read(result.getResponse().getContentAsString(), "$.imageUrl");
        Path stored = mediaProperties.directory().toAbsolutePath().resolve(url.substring("/media/".length()));

        assertThat(Files.readAllBytes(stored)).isEqualTo(PNG);
        mockMvc.perform(get(url)).andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Content-Security-Policy", org.hamcrest.Matchers.containsString("sandbox")));
        mockMvc.perform(head(url)).andExpect(status().isOk());

        mockMvc.perform(delete("/api/admin/maps/busan/image").cookie(adminCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrl").doesNotExist());
        assertThat(Files.exists(stored)).isFalse();
    }

    @Test
    void replacingTheImageDeletesTheOldFile() throws Exception {
        MvcResult first = mockMvc.perform(upload("/api/admin/maps/ilios/image", "a.png", PNG).cookie(adminCookie))
                .andExpect(status().isOk()).andReturn();
        byte[] other = {(byte) 0x89, 'P', 'N', 'G', 13, 10, 26, 10, 9, 9, 9};
        MvcResult second = mockMvc.perform(upload("/api/admin/maps/ilios/image", "b.png", other).cookie(adminCookie))
                .andExpect(status().isOk()).andReturn();
        String firstUrl = JsonPath.read(first.getResponse().getContentAsString(), "$.imageUrl");
        String secondUrl = JsonPath.read(second.getResponse().getContentAsString(), "$.imageUrl");
        Path root = mediaProperties.directory().toAbsolutePath();

        assertThat(firstUrl).isNotEqualTo(secondUrl);
        assertThat(Files.exists(root.resolve(firstUrl.substring("/media/".length())))).isFalse();
        assertThat(Files.exists(root.resolve(secondUrl.substring("/media/".length())))).isTrue();

        mockMvc.perform(delete("/api/admin/maps/ilios/image").cookie(adminCookie)).andExpect(status().isOk());
    }

    @Test
    void rejectsFilesThatAreNotImages() throws Exception {
        byte[] script = "<svg onload=alert(1)>".getBytes();

        mockMvc.perform(upload("/api/admin/maps/busan/image", "x.svg", script).cookie(adminCookie))
                .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsFilesOverTheSizeLimit() throws Exception {
        byte[] huge = new byte[3 * 1024 * 1024];
        huge[0] = (byte) 0x89;
        huge[1] = 'P';
        huge[2] = 'N';
        huge[3] = 'G';

        mockMvc.perform(upload("/api/admin/maps/busan/image", "huge.png", huge).cookie(adminCookie))
                .andExpect(status().isBadRequest());
    }

    @Test
    void ordinaryUsersAndAnonymousVisitorsCannotUpload() throws Exception {
        mockMvc.perform(upload("/api/admin/maps/busan/image", "map.png", PNG)).andExpect(status().isUnauthorized());
        mockMvc.perform(upload("/api/admin/maps/busan/image", "map.png", PNG).cookie(userCookie))
                .andExpect(status().isForbidden());
    }

    @Test
    void unknownMapIsNotFound() throws Exception {
        mockMvc.perform(upload("/api/admin/maps/no-such-map/image", "map.png", PNG).cookie(adminCookie))
                .andExpect(status().isNotFound());
    }

    private org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder upload(
            String path, String fileName, byte[] content) {
        var builder = multipart(HttpMethod.PUT, path);
        builder.file(new MockMultipartFile("file", fileName, "application/octet-stream", content));
        return builder;
    }

    private User account(long id, UserRole role) {
        User user = new User();
        user.setId(id);
        user.setEmail("upload" + id + "@overlab.gg");
        user.setDisplayName("Upload " + id);
        user.setRole(role);
        return user;
    }
}
