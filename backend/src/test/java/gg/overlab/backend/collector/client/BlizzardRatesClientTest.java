package gg.overlab.backend.collector.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.headerDoesNotExist;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.queryParam;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import gg.overlab.backend.collector.CollectorFixtures;
import gg.overlab.backend.collector.snapshot.InvalidSnapshotException;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;

class BlizzardRatesClientTest {

    private final RestClient.Builder builder = RestClient.builder();
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();

    private BlizzardRatesClient client(int maxAttempts) {
        return new BlizzardRatesClient(builder, CollectorFixtures.properties(maxAttempts));
    }

    private List<BlizzardRatesResponse.HeroRate> fetch(BlizzardRatesClient client) {
        return client.fetch(GameQueue.COMPETITIVE, Platform.PC, Region.EUROPE, RankTier.GOLD, "rialto").rates();
    }

    @Test
    void sendsExpectedQueryParametersAndParsesHeroes() {
        server.expect(requestTo(org.hamcrest.Matchers.startsWith("https://overwatch.example/en-us/rates/data/")))
                .andExpect(queryParam("input", "PC"))
                .andExpect(queryParam("map", "rialto"))
                .andExpect(queryParam("region", "Europe"))
                .andExpect(queryParam("rq", "2"))
                .andExpect(queryParam("tier", "Gold"))
                .andRespond(withSuccess(CollectorFixtures.SAMPLE_JSON, MediaType.APPLICATION_JSON));

        List<BlizzardRatesResponse.HeroRate> rates = fetch(client(3));

        assertThat(rates).hasSize(2);
        assertThat(rates.get(0).id()).isEqualTo("ana");
        assertThat(rates.get(0).cells().banrate()).isEqualByComparingTo("11.9");
        assertThat(rates.get(1).hero().role()).isEqualTo("TANK");
        server.verify();
    }

    @Test
    void switchesToTheOtherQueueWhenBlizzardRenumbersCompetitive() {
        server.expect(queryParam("rq", "2"))
                .andRespond(withSuccess(CollectorFixtures.WITHOUT_BAN_RATE_JSON, MediaType.APPLICATION_JSON));
        server.expect(queryParam("rq", "1"))
                .andRespond(withSuccess(CollectorFixtures.SAMPLE_JSON, MediaType.APPLICATION_JSON));
        server.expect(queryParam("rq", "1"))
                .andRespond(withSuccess(CollectorFixtures.SAMPLE_JSON, MediaType.APPLICATION_JSON));
        BlizzardRatesClient client = client(1);

        assertThat(fetch(client)).hasSize(2);
        assertThat(fetch(client)).hasSize(2);
        server.verify();
    }

    @Test
    void anEmptyAnswerDoesNotMakeAQueueTheRememberedCompetitiveQueue() {
        server.expect(queryParam("rq", "2"))
                .andRespond(withSuccess(CollectorFixtures.WITHOUT_BAN_RATE_JSON, MediaType.APPLICATION_JSON));
        server.expect(queryParam("rq", "1"))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));
        server.expect(queryParam("rq", "2"))
                .andRespond(withSuccess(CollectorFixtures.SAMPLE_JSON, MediaType.APPLICATION_JSON));
        BlizzardRatesClient client = client(1);

        assertThat(fetch(client)).isEmpty();
        assertThat(fetch(client)).hasSize(2);
        server.verify();
    }

    @Test
    void waitsForTheRetryAfterHeaderOfATooManyRequestsAnswer() {
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.RETRY_AFTER, "1");
        server.expect(requestTo(org.hamcrest.Matchers.startsWith("https://overwatch.example")))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS).headers(headers));
        server.expect(requestTo(org.hamcrest.Matchers.startsWith("https://overwatch.example")))
                .andRespond(withSuccess(CollectorFixtures.SAMPLE_JSON, MediaType.APPLICATION_JSON));
        long started = System.nanoTime();

        assertThat(fetch(client(2))).hasSize(2);

        assertThat(Duration.ofNanos(System.nanoTime() - started)).isGreaterThanOrEqualTo(Duration.ofMillis(900));
        server.verify();
    }

    @Test
    void failsWhenNoQueueHasBanRates() {
        server.expect(queryParam("rq", "2"))
                .andRespond(withSuccess(CollectorFixtures.WITHOUT_BAN_RATE_JSON, MediaType.APPLICATION_JSON));
        server.expect(queryParam("rq", "1"))
                .andRespond(withSuccess(CollectorFixtures.WITHOUT_BAN_RATE_JSON, MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> fetch(client(1))).isInstanceOf(InvalidSnapshotException.class);
        server.verify();
    }

    @Test
    void sendsTheKnownEtagAndReportsNotModified() {
        server.expect(header("If-None-Match", "W/\"abc\""))
                .andRespond(withStatus(HttpStatus.NOT_MODIFIED));

        RatesFetch fetched = client(1).fetch(GameQueue.COMPETITIVE, Platform.PC, Region.EUROPE, RankTier.GOLD,
                "rialto", "W/\"abc\"");

        assertThat(fetched.notModified()).isTrue();
        assertThat(fetched.rates()).isEmpty();
        server.verify();
    }

    @Test
    void returnsTheEtagOfAFreshResponse() {
        server.expect(requestTo(org.hamcrest.Matchers.startsWith("https://overwatch.example")))
                .andRespond(withSuccess(CollectorFixtures.SAMPLE_JSON, MediaType.APPLICATION_JSON)
                        .header("ETag", "W/\"fresh\""));

        RatesFetch fetched = client(1).fetch(GameQueue.COMPETITIVE, Platform.PC, Region.EUROPE, RankTier.GOLD,
                "rialto", null);

        assertThat(fetched.notModified()).isFalse();
        assertThat(fetched.etag()).isEqualTo("W/\"fresh\"");
        assertThat(fetched.rates()).hasSize(2);
    }

    @Test
    void sendsNoConditionHeaderWithoutAKnownEtag() {
        server.expect(headerDoesNotExist("If-None-Match"))
                .andRespond(withSuccess(CollectorFixtures.SAMPLE_JSON, MediaType.APPLICATION_JSON));

        client(1).fetch(GameQueue.COMPETITIVE, Platform.PC, Region.EUROPE, RankTier.GOLD, "rialto");

        server.verify();
    }

    @Test
    void quickPlayUsesQueueZero() {
        server.expect(queryParam("rq", "0"))
                .andRespond(withSuccess(CollectorFixtures.SAMPLE_JSON, MediaType.APPLICATION_JSON));

        client(1).fetch(GameQueue.QUICK_PLAY, Platform.CONSOLE, Region.ASIA, RankTier.ALL, "all-maps");

        server.verify();
    }

    @Test
    void retriesServerErrorsAndSucceeds() {
        server.expect(requestTo(org.hamcrest.Matchers.startsWith("https://overwatch.example")))
                .andRespond(withServerError());
        server.expect(requestTo(org.hamcrest.Matchers.startsWith("https://overwatch.example")))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS));
        server.expect(requestTo(org.hamcrest.Matchers.startsWith("https://overwatch.example")))
                .andRespond(withSuccess(CollectorFixtures.SAMPLE_JSON, MediaType.APPLICATION_JSON));

        assertThat(fetch(client(3))).hasSize(2);
        server.verify();
    }

    @Test
    void givesUpAfterMaxAttempts() {
        server.expect(requestTo(org.hamcrest.Matchers.startsWith("https://overwatch.example")))
                .andRespond(withServerError());
        server.expect(requestTo(org.hamcrest.Matchers.startsWith("https://overwatch.example")))
                .andRespond(withServerError());

        assertThatThrownBy(() -> fetch(client(2))).isInstanceOf(HttpServerErrorException.class);
        server.verify();
    }

    @Test
    void doesNotRetryClientErrors() {
        server.expect(requestTo(org.hamcrest.Matchers.startsWith("https://overwatch.example")))
                .andRespond(withStatus(HttpStatus.NOT_FOUND));

        assertThatThrownBy(() -> fetch(client(3))).isInstanceOf(HttpClientErrorException.NotFound.class);
        server.verify();
    }

    @Test
    void emptyBodyYieldsNoHeroes() {
        server.expect(requestTo(org.hamcrest.Matchers.startsWith("https://overwatch.example")))
                .andRespond(withSuccess("{}", MediaType.APPLICATION_JSON));

        assertThat(fetch(client(1))).isEmpty();
    }
}
