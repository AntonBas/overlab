package gg.overlab.backend.collector;

import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

@Slf4j
@Component
public class BlizzardRatesClient {

    private static final String RATES_PATH = "/en-us/rates/data/";
    private static final int COMPETITIVE_QUEUE = 2;
    private static final int QUICK_PLAY_QUEUE = 0;

    private final RestClient restClient;
    private final CollectorProperties.Retry retry;

    @Autowired
    public BlizzardRatesClient(CollectorProperties properties) {
        this(requestFactoryBuilder(properties), properties);
    }

    BlizzardRatesClient(RestClient.Builder builder, CollectorProperties properties) {
        this.retry = properties.retry();
        this.restClient = builder
                .baseUrl(properties.baseUrl())
                .defaultHeader(HttpHeaders.USER_AGENT, properties.userAgent())
                .build();
    }

    public List<BlizzardRatesResponse.HeroRate> fetch(GameQueue queue, Platform platform, Region region,
                                                       RankTier tier, String mapSlug) {
        for (int attempt = 1; ; attempt++) {
            try {
                return fetchOnce(queue, platform, region, tier, mapSlug);
            } catch (ResourceAccessException | HttpServerErrorException | HttpClientErrorException.TooManyRequests
                     exception) {
                if (attempt >= retry.maxAttempts()) {
                    throw exception;
                }
                Duration delay = retry.backoff().multipliedBy(attempt);
                log.warn("Blizzard request failed (attempt {}/{}), retrying in {}: {}", attempt, retry.maxAttempts(),
                        delay, exception.getMessage());
                sleep(delay);
            }
        }
    }

    private List<BlizzardRatesResponse.HeroRate> fetchOnce(GameQueue queue, Platform platform, Region region,
                                                           RankTier tier, String mapSlug) {
        BlizzardRatesResponse response = restClient.get()
                .uri(uriBuilder -> uriBuilder.path(RATES_PATH)
                        .queryParam("input", platformParameter(platform))
                        .queryParam("map", mapSlug)
                        .queryParam("region", capitalized(region))
                        .queryParam("role", "All")
                        .queryParam("rq", queue == GameQueue.COMPETITIVE ? COMPETITIVE_QUEUE : QUICK_PLAY_QUEUE)
                        .queryParam("tier", capitalized(tier))
                        .build())
                .retrieve()
                .body(BlizzardRatesResponse.class);
        if (response == null || response.rates() == null || response.rates().rates() == null) {
            return List.of();
        }
        return response.rates().rates();
    }

    private static RestClient.Builder requestFactoryBuilder(CollectorProperties properties) {
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(properties.timeouts().connect()).build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(properties.timeouts().read());
        return RestClient.builder().requestFactory(requestFactory);
    }

    private void sleep(Duration delay) {
        try {
            Thread.sleep(delay);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        }
    }

    private String platformParameter(Platform platform) {
        return platform == Platform.PC ? "PC" : "Console";
    }

    private String capitalized(Enum<?> value) {
        String lower = value.name().toLowerCase(Locale.ROOT);
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }
}
