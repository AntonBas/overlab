package gg.overlab.backend.collector;

import java.net.URI;
import java.net.http.HttpClient;
import java.util.Arrays;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Pattern;
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
    private static final int MAX_SVG_BYTES = 64 * 1024;
    private static final Pattern UNSAFE_SVG = Pattern.compile(
            "<script|<foreignobject|<iframe|<embed|<object|javascript:|\\son[a-z]+\\s*=", Pattern.CASE_INSENSITIVE);
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

    public Optional<byte[]> downloadSvg(String sourceUrl) {
        if (sourceUrl == null || !sourceUrl.startsWith("https://")) {
            return Optional.empty();
        }
        try {
            byte[] content = restClient.get().uri(URI.create(sourceUrl)).retrieve().body(byte[].class);
            if (!isSafeSvg(content)) {
                log.warn("{} is not a plain SVG within {} bytes, skipped", sourceUrl, MAX_SVG_BYTES);
                return Optional.empty();
            }
            return Optional.of(content);
        } catch (RuntimeException exception) {
            log.warn("Could not download {}: {}", sourceUrl, exception.getMessage());
            return Optional.empty();
        }
    }

    private boolean isSafeSvg(byte[] content) {
        if (content == null || content.length == 0 || content.length > MAX_SVG_BYTES) {
            return false;
        }
        String text = new String(content, StandardCharsets.UTF_8).strip();
        String start = text.toLowerCase(Locale.ROOT);
        boolean looksLikeSvg = start.startsWith("<svg") || (start.startsWith("<?xml") && start.contains("<svg"));
        return looksLikeSvg && !UNSAFE_SVG.matcher(text).find();
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
