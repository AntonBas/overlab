package gg.overlab.backend.collector;

import java.net.URI;
import java.net.http.HttpClient;
import java.util.Arrays;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Slf4j
@Component
public class ImageDownloader {

    private static final int MAX_BYTES = 2 * 1024 * 1024;
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 'P', 'N', 'G'};

    private final RestClient restClient;

    @Autowired
    public ImageDownloader(CollectorProperties properties) {
        this(requestFactoryBuilder(properties), properties.userAgent());
    }

    ImageDownloader(RestClient.Builder builder, String userAgent) {
        this.restClient = builder.defaultHeader(HttpHeaders.USER_AGENT, userAgent).build();
    }

    public Optional<byte[]> downloadPng(String sourceUrl) {
        if (sourceUrl == null || !sourceUrl.startsWith("https://")) {
            return Optional.empty();
        }
        try {
            byte[] content = restClient.get().uri(URI.create(sourceUrl)).retrieve().body(byte[].class);
            if (!isAcceptablePng(content)) {
                log.warn("{} is not a PNG within {} bytes, skipped", sourceUrl, MAX_BYTES);
                return Optional.empty();
            }
            return Optional.of(content);
        } catch (RuntimeException exception) {
            log.warn("Could not download {}: {}", sourceUrl, exception.getMessage());
            return Optional.empty();
        }
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
