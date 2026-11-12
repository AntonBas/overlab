package gg.overlab.backend.collector.client;

import gg.overlab.backend.collector.CollectorProperties;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class PatchNotesClient {

    public static final String PATCH_NOTES_PATH = "/en-us/news/patch-notes/";

    private final RestClient restClient;

    public PatchNotesClient(@Qualifier(CollectorHttpConfig.REST_CLIENT_BUILDER) RestClient.Builder builder,
            CollectorProperties properties) {
        this.restClient = builder
                .baseUrl(properties.baseUrl())
                .defaultHeader(HttpHeaders.USER_AGENT, properties.userAgent())
                .build();
    }

    public String fetch() {
        return restClient.get().uri(PATCH_NOTES_PATH).retrieve().body(String.class);
    }
}
