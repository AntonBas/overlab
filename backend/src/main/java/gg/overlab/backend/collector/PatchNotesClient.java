package gg.overlab.backend.collector;

import java.net.http.HttpClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class PatchNotesClient {

    public static final String PATCH_NOTES_PATH = "/en-us/news/patch-notes/";

    private final RestClient restClient;

    @Autowired
    public PatchNotesClient(CollectorProperties properties) {
        this(requestFactoryBuilder(properties), properties);
    }

    PatchNotesClient(RestClient.Builder builder, CollectorProperties properties) {
        this.restClient = builder
                .baseUrl(properties.baseUrl())
                .defaultHeader(HttpHeaders.USER_AGENT, properties.userAgent())
                .build();
    }

    public String fetch() {
        return restClient.get().uri(PATCH_NOTES_PATH).retrieve().body(String.class);
    }

    private static RestClient.Builder requestFactoryBuilder(CollectorProperties properties) {
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(properties.timeouts().connect()).build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(properties.timeouts().read());
        return RestClient.builder().requestFactory(requestFactory);
    }
}
