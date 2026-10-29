package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class BlizzardHeroPageClientTest {

    private final RestClient.Builder builder = RestClient.builder();
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
    private final BlizzardHeroPageClient client =
            new BlizzardHeroPageClient(builder, CollectorFixtures.properties(1));

    @Test
    void fetchesTheHeroPageBySlug() {
        server.expect(requestTo("https://overwatch.example/en-us/heroes/ana/"))
                .andRespond(withSuccess("<html>ana</html>", MediaType.TEXT_HTML));

        assertThat(client.fetch("ana")).contains("<html>ana</html>");
        server.verify();
    }

    @Test
    void unknownHeroGivesNoPage() {
        server.expect(requestTo("https://overwatch.example/en-us/heroes/nobody/"))
                .andRespond(withStatus(HttpStatus.NOT_FOUND));

        assertThat(client.fetch("nobody")).isEmpty();
    }
}
