package gg.overlab.backend.collector.client;

import gg.overlab.backend.collector.CollectorProperties;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

@Component
public class BlizzardHeroPageClient {

    private static final String HERO_PAGE_PATH = "/en-us/heroes/{slug}/";

    private final RestClient restClient;

    public BlizzardHeroPageClient(@Qualifier(CollectorHttpConfig.REST_CLIENT_BUILDER) RestClient.Builder builder, CollectorProperties properties) {
        this.restClient = builder
                .baseUrl(properties.baseUrl())
                .defaultHeader(HttpHeaders.USER_AGENT, properties.userAgent())
                .build();
    }

    public Optional<String> fetch(String heroSlug) {
        try {
            return Optional.ofNullable(restClient.get().uri(HERO_PAGE_PATH, heroSlug).retrieve().body(String.class));
        } catch (HttpClientErrorException.NotFound exception) {
            return Optional.empty();
        }
    }
}
