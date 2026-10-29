package gg.overlab.backend.collector;

import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.media.MediaFolder;
import gg.overlab.backend.media.MediaStorage;
import java.net.URI;
import java.net.http.HttpClient;
import java.util.Arrays;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Slf4j
@Component
public class HeroPortraitDownloader {

    private static final int MAX_BYTES = 2 * 1024 * 1024;
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 'P', 'N', 'G'};

    private final RestClient restClient;
    private final MediaStorage mediaStorage;
    private final boolean enabled;

    @Autowired
    public HeroPortraitDownloader(CollectorProperties properties, MediaStorage mediaStorage) {
        this(requestFactoryBuilder(properties), properties.userAgent(), mediaStorage, properties.downloadPortraits());
    }

    HeroPortraitDownloader(RestClient.Builder builder, String userAgent, MediaStorage mediaStorage,
                           boolean enabled) {
        this.restClient = builder.defaultHeader(HttpHeaders.USER_AGENT, userAgent).build();
        this.mediaStorage = mediaStorage;
        this.enabled = enabled;
    }

    public void ensurePortrait(Hero hero, String sourceUrl) {
        if (!enabled || hasPortrait(hero) || sourceUrl == null || !sourceUrl.startsWith("https://")) {
            return;
        }
        try {
            byte[] content = restClient.get().uri(URI.create(sourceUrl)).retrieve().body(byte[].class);
            if (!isAcceptablePng(content)) {
                log.warn("Portrait of {} is not a PNG within {} bytes, skipped", hero.getSlug(), MAX_BYTES);
                return;
            }
            hero.setPortraitUrl(mediaStorage.save(MediaFolder.HEROES, hero.getSlug() + ".png", content));
        } catch (RuntimeException exception) {
            log.warn("Could not download the portrait of {}: {}", hero.getSlug(), exception.getMessage());
        }
    }

    private boolean hasPortrait(Hero hero) {
        String stored = hero.getPortraitUrl();
        if (stored == null || stored.isBlank()) {
            return false;
        }
        return stored.startsWith("http") || mediaStorage.exists(stored);
    }

    private boolean isAcceptablePng(byte[] content) {
        return content != null && content.length > PNG_SIGNATURE.length && content.length <= MAX_BYTES
                && Arrays.equals(Arrays.copyOf(content, PNG_SIGNATURE.length), PNG_SIGNATURE);
    }

    private static RestClient.Builder requestFactoryBuilder(CollectorProperties properties) {
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(properties.timeouts().connect()).build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(properties.timeouts().read());
        return RestClient.builder().requestFactory(requestFactory);
    }
}
