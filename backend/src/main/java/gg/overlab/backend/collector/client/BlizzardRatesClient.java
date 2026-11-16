package gg.overlab.backend.collector.client;

import gg.overlab.backend.collector.CollectorProperties;
import gg.overlab.backend.collector.snapshot.InvalidSnapshotException;
import gg.overlab.backend.common.Pause;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

/**
 * Reads the undocumented Blizzard rates endpoint. Competitive Role Queue is the only queue with ban rates, but
 * Blizzard has swapped its code between 1 and 2 more than once, so the client tries the last working code first
 * and falls back to the other one when the response has no ban rate column.
 */
@Slf4j
@Component
public class BlizzardRatesClient {

    private static final String RATES_PATH = "/en-us/rates/data/";
    private static final List<Integer> COMPETITIVE_QUEUES = List.of(2, 1);
    private static final int QUICK_PLAY_QUEUE = 0;
    private static final Duration MAX_RETRY_AFTER = Duration.ofMinutes(5);
    private static final String BAN_RATE_COLUMN = "banrate";

    private final RestClient restClient;
    private final CollectorProperties.Retry retry;
    private final Duration pause;
    private volatile int competitiveQueue = COMPETITIVE_QUEUES.get(0);

    public BlizzardRatesClient(@Qualifier(CollectorHttpConfig.REST_CLIENT_BUILDER) RestClient.Builder builder,
            CollectorProperties properties) {
        this.retry = properties.retry();
        this.pause = properties.pause();
        this.restClient = builder
                .baseUrl(properties.baseUrl())
                .defaultHeader(HttpHeaders.USER_AGENT, properties.userAgent())
                .build();
    }

    public RatesFetch fetch(GameQueue queue, Platform platform, Region region, RankTier tier, String mapSlug) {
        return fetch(queue, platform, region, tier, mapSlug, null);
    }

    public RatesFetch fetch(GameQueue queue, Platform platform, Region region, RankTier tier, String mapSlug,
                            String knownEtag) {
        for (int attempt = 1; ; attempt++) {
            try {
                return fetchOnce(queue, platform, region, tier, mapSlug, knownEtag);
            } catch (ResourceAccessException | HttpServerErrorException | HttpClientErrorException.TooManyRequests
                     exception) {
                if (attempt >= retry.maxAttempts()) {
                    throw exception;
                }
                Duration delay = retryDelay(exception, attempt);
                log.warn("Blizzard request failed (attempt {}/{}), retrying in {}: {}", attempt, retry.maxAttempts(),
                        delay, exception.getMessage());
                if (!Pause.sleep(delay)) {
                    throw exception;
                }
            }
        }
    }

    private Duration retryDelay(RuntimeException exception, int attempt) {
        Duration backoff = retry.backoff().multipliedBy(attempt);
        if (exception instanceof HttpClientErrorException.TooManyRequests tooMany) {
            String retryAfter = tooMany.getResponseHeaders() == null
                    ? null : tooMany.getResponseHeaders().getFirst(HttpHeaders.RETRY_AFTER);
            Duration requested = parseRetryAfterSeconds(retryAfter);
            if (requested != null && requested.compareTo(backoff) > 0) {
                return requested.compareTo(MAX_RETRY_AFTER) > 0 ? MAX_RETRY_AFTER : requested;
            }
        }
        return backoff;
    }

    private static Duration parseRetryAfterSeconds(String value) {
        if (value == null || !value.trim().matches("\\d{1,6}")) {
            return null;
        }
        return Duration.ofSeconds(Long.parseLong(value.trim()));
    }

    private RatesFetch fetchOnce(GameQueue queue, Platform platform, Region region, RankTier tier,
                                 String mapSlug, String knownEtag) {
        if (queue == GameQueue.QUICK_PLAY) {
            ResponseEntity<BlizzardRatesResponse> entity =
                    request(QUICK_PLAY_QUEUE, platform, region, tier, mapSlug, knownEtag);
            return entity.getStatusCode() == HttpStatus.NOT_MODIFIED
                    ? RatesFetch.unchanged()
                    : new RatesFetch(heroes(entity.getBody()), etagOf(entity), false);
        }
        String etagForFirstCandidate = knownEtag;
        for (int candidate : competitiveCandidates()) {
            ResponseEntity<BlizzardRatesResponse> entity =
                    request(candidate, platform, region, tier, mapSlug, etagForFirstCandidate);
            etagForFirstCandidate = null;
            if (entity.getStatusCode() == HttpStatus.NOT_MODIFIED) {
                competitiveQueue = candidate;
                return RatesFetch.unchanged();
            }
            BlizzardRatesResponse response = entity.getBody();
            boolean hasBanRate = hasBanRateColumn(response);
            if (hasBanRate) {
                competitiveQueue = candidate;
            }
            if (hasBanRate || heroes(response).isEmpty()) {
                return new RatesFetch(heroes(response), etagOf(entity), false);
            }
            log.warn("Queue {} returned no ban rate column, trying the next Competitive queue", candidate);
            if (!Pause.sleep(pause)) {
                throw new InvalidSnapshotException("Interrupted while looking for the Competitive queue");
            }
        }
        throw new InvalidSnapshotException("No Blizzard queue returned Competitive statistics with ban rates");
    }

    private List<Integer> competitiveCandidates() {
        int current = competitiveQueue;
        return Stream.concat(
                Stream.of(current),
                COMPETITIVE_QUEUES.stream().filter(candidate -> candidate != current)).toList();
    }

    private ResponseEntity<BlizzardRatesResponse> request(int queueCode, Platform platform, Region region,
                                                          RankTier tier, String mapSlug, String knownEtag) {
        RestClient.RequestHeadersSpec<?> spec = restClient.get()
                .uri(uriBuilder -> uriBuilder.path(RATES_PATH)
                        .queryParam("input", platformParameter(platform))
                        .queryParam("map", mapSlug)
                        .queryParam("region", capitalized(region))
                        .queryParam("role", "All")
                        .queryParam("rq", queueCode)
                        .queryParam("tier", capitalized(tier))
                        .build());
        if (knownEtag != null) {
            spec = spec.header(HttpHeaders.IF_NONE_MATCH, knownEtag);
        }
        return spec.retrieve().toEntity(BlizzardRatesResponse.class);
    }

    private String etagOf(ResponseEntity<?> entity) {
        return entity.getHeaders().getFirst(HttpHeaders.ETAG);
    }

    private List<BlizzardRatesResponse.HeroRate> heroes(BlizzardRatesResponse response) {
        if (response == null || response.rates() == null || response.rates().rates() == null) {
            return List.of();
        }
        return response.rates().rates();
    }

    private boolean hasBanRateColumn(BlizzardRatesResponse response) {
        return response.columns() != null
                && response.columns().stream().anyMatch(column -> BAN_RATE_COLUMN.equals(column.id()));
    }

    private String platformParameter(Platform platform) {
        return platform == Platform.PC ? "PC" : "Console";
    }

    private String capitalized(Enum<?> value) {
        String lower = value.name().toLowerCase(Locale.ROOT);
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }
}
