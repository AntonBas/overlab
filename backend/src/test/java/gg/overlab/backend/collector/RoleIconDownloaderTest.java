package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import gg.overlab.backend.media.MediaProperties;
import gg.overlab.backend.media.MediaStorage;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class RoleIconDownloaderTest {

    private static final String SOURCE = "https://cdn.example/tank.svg";
    private static final String SVG = "<svg width=\"42\" height=\"42\"><path d=\"M0 0h4v4z\"/></svg>";

    @TempDir
    Path directory;

    private final RestClient.Builder builder = RestClient.builder();
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();

    private MediaStorage storage() {
        return new MediaStorage(new MediaProperties(directory, "/media"));
    }

    private RoleIconDownloader downloader(boolean enabled) {
        return new RoleIconDownloader(new ImageDownloader(builder, "test-agent"), storage(), enabled);
    }

    @Test
    void savesTheRoleIconUnderTheLowercaseRoleName() throws Exception {
        server.expect(requestTo(SOURCE)).andRespond(withSuccess(SVG, MediaType.valueOf("image/svg+xml")));

        downloader(true).ensureRoleIcon("TANK", SOURCE);

        assertThat(Files.readString(directory.resolve("roles/tank.svg"))).isEqualTo(SVG);
        server.verify();
    }

    @Test
    void doesNotDownloadAgainOnceTheFileExists() {
        storage().save(gg.overlab.backend.media.MediaFolder.ROLES, "tank.svg", SVG.getBytes());

        downloader(true).ensureRoleIcon("TANK", SOURCE);

        server.verify();
    }

    @Test
    void doesNothingWhileDownloadsAreDisabled() {
        downloader(false).ensureRoleIcon("TANK", SOURCE);

        assertThat(Files.exists(directory.resolve("roles"))).isFalse();
        server.verify();
    }

    @Test
    void refusesSvgWithScriptsOrHandlers() {
        String[] unsafe = {
            "<svg><script>alert(1)</script></svg>",
            "<svg onload=\"alert(1)\"></svg>",
            "<svg><a href=\"javascript:alert(1)\"/></svg>",
            "<svg><foreignObject/></svg>",
            "<html><body>not an svg</body></html>"};
        for (String body : unsafe) {
            server.expect(requestTo(SOURCE)).andRespond(withSuccess(body, MediaType.valueOf("image/svg+xml")));
        }
        ImageDownloader imageDownloader = new ImageDownloader(builder, "test-agent");

        for (String body : unsafe) {
            assertThat(imageDownloader.downloadSvg(SOURCE)).as(body).isEmpty();
        }
    }

    @Test
    void acceptsAnXmlDeclaredSvg() {
        server.expect(requestTo(SOURCE)).andRespond(withSuccess("<?xml version=\"1.0\"?>" + SVG,
                MediaType.valueOf("image/svg+xml")));

        assertThat(new ImageDownloader(builder, "test-agent").downloadSvg(SOURCE)).isPresent();
    }
}
