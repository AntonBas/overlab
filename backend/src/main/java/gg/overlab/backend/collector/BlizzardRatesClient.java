package gg.overlab.backend.collector;

import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class BlizzardRatesClient {

    private static final String RATES_PATH = "/en-us/rates/data/";

    private final RestClient restClient;

    public BlizzardRatesClient(CollectorProperties properties) {
        this.restClient = RestClient.builder()
                .baseUrl(properties.baseUrl())
                .defaultHeader(HttpHeaders.USER_AGENT, properties.userAgent())
                .build();
    }

    public List<BlizzardRatesResponse.HeroRate> fetch(GameQueue queue, Platform platform, Region region,
                                                       RankTier tier, String mapSlug) {
        BlizzardRatesResponse response = restClient.get()
                .uri(uriBuilder -> uriBuilder.path(RATES_PATH)
                        .queryParam("input", platformParameter(platform))
                        .queryParam("map", mapSlug)
                        .queryParam("region", capitalized(region))
                        .queryParam("role", "All")
                        .queryParam("rq", queue == GameQueue.COMPETITIVE ? 1 : 0)
                        .queryParam("tier", capitalized(tier))
                        .build())
                .retrieve()
                .body(BlizzardRatesResponse.class);
        if (response == null || response.rates() == null || response.rates().rates() == null) {
            return List.of();
        }
        return response.rates().rates();
    }

    private String platformParameter(Platform platform) {
        return platform == Platform.PC ? "PC" : "Console";
    }

    private String capitalized(Enum<?> value) {
        String lower = value.name().toLowerCase(Locale.ROOT);
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }
}
