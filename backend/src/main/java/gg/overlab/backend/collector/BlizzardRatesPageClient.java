package gg.overlab.backend.collector;

import java.net.http.HttpClient;
import java.util.Optional;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

@Component
public class BlizzardRatesPageClient {

    private static final String RATES_PAGE_PATH = "/en-us/rates/";

    private final RestClient restClient;

    public BlizzardRatesPageClient(CollectorProperties properties) {
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(properties.timeouts().connect()).build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(properties.timeouts().read());
        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
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
