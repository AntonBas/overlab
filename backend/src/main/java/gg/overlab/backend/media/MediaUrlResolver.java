package gg.overlab.backend.media;

import org.springframework.stereotype.Component;

@Component
public class MediaUrlResolver {

    private final String baseUrl;

    public MediaUrlResolver(MediaProperties properties) {
        this.baseUrl = properties.baseUrl().replaceAll("/+$", "");
    }

    public String resolve(String storedPath) {
        if (storedPath == null || storedPath.isBlank()) {
            return null;
        }
        if (storedPath.startsWith("/") || storedPath.startsWith("http://") || storedPath.startsWith("https://")) {
            return storedPath;
        }
        return baseUrl + "/" + storedPath;
    }
}
