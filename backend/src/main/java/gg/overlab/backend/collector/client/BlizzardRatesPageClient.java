package gg.overlab.backend.collector.client;

import gg.overlab.backend.collector.CollectorProperties;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

@Component
public class BlizzardRatesPageClient {

    private static final String RATES_PAGE_PATH = "/en-us/rates/";

    private final RestClient restClient;

    public BlizzardRatesPageClient(@Qualifier(CollectorHttpConfig.REST_CLIENT_BUILDER) RestClient.Builder builder, CollectorProperties properties) {
        this.restClient = builder
                .baseUrl(properties.baseUrl())
                .defaultHeader(HttpHeaders.USER_AGENT, properties.userAgent())
                .build();
    }

    public Optional<String> fetch() {
        try {
            return Optional.ofNullable(restClient.get().uri(RATES_PAGE_PATH).retrieve().body(String.class));
        } catch (HttpClientErrorException.NotFound exception) {
            return Optional.empty();
        }
    }
}
