package gg.overlab.backend.collector;

import java.net.http.HttpClient;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

@Component
public class BlizzardHeroPageClient {

    private static final String HERO_PAGE_PATH = "/en-us/heroes/{slug}/";

    private final RestClient restClient;

    @Autowired
    public BlizzardHeroPageClient(CollectorProperties properties) {
        this(requestFactoryBuilder(properties), properties);
    }

    BlizzardHeroPageClient(RestClient.Builder builder, CollectorProperties properties) {
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

    private static RestClient.Builder requestFactoryBuilder(CollectorProperties properties) {
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(properties.timeouts().connect()).build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(properties.timeouts().read());
        return RestClient.builder().requestFactory(requestFactory);
    }
}
