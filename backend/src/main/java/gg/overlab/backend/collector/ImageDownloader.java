package gg.overlab.backend.collector;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.util.Arrays;
import java.nio.charset.StandardCharsets;
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
    private static final int MAX_SVG_BYTES = 64 * 1024;
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
        return download(sourceUrl, MAX_BYTES)
                .filter(this::isAcceptablePng)
                .or(() -> rejected(sourceUrl, "a PNG", MAX_BYTES));
    }

    public Optional<byte[]> downloadSvg(String sourceUrl) {
        return download(sourceUrl, MAX_SVG_BYTES)
                .filter(this::isSafeSvg)
                .or(() -> rejected(sourceUrl, "a plain SVG", MAX_SVG_BYTES));
    }

    private Optional<byte[]> rejected(String sourceUrl, String expected, int maxBytes) {
        if (sourceUrl != null && sourceUrl.startsWith("https://")) {
            log.warn("{} is not {} within {} bytes, skipped", sourceUrl, expected, maxBytes);
        }
        return Optional.empty();
    }

    private Optional<byte[]> download(String sourceUrl, int maxBytes) {
        if (sourceUrl == null || !sourceUrl.startsWith("https://")) {
            return Optional.empty();
        }
        try {
            return Optional.ofNullable(restClient.get().uri(URI.create(sourceUrl))
                    .exchange((request, response) -> readLimited(response, maxBytes)));
        } catch (RuntimeException exception) {
            log.warn("Could not download {}: {}", sourceUrl, exception.getMessage());
            return Optional.empty();
        }
    }

    private byte[] readLimited(RestClient.RequestHeadersSpec.ConvertibleClientHttpResponse response, int maxBytes)
            throws IOException {
        if (response.getStatusCode().isError() || response.getHeaders().getContentLength() > maxBytes) {
            return null;
        }
        byte[] content = response.getBody().readNBytes(maxBytes + 1);
        return content.length > maxBytes ? null : content;
    }

    private boolean isSafeSvg(byte[] content) {
        return content.length > 0 && SvgValidator.isSafe(new String(content, StandardCharsets.UTF_8).strip());
    }

    private boolean isAcceptablePng(byte[] content) {
        return content.length > PNG_SIGNATURE.length
                && Arrays.equals(Arrays.copyOf(content, PNG_SIGNATURE.length), PNG_SIGNATURE);
    }

    private static RestClient.Builder requestFactoryBuilder(CollectorProperties properties) {
        HttpClient httpClient = HttpClient.newBuilder().connectTimeout(properties.timeouts().connect()).build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(properties.timeouts().read());
        return RestClient.builder().requestFactory(requestFactory);
    }
}
