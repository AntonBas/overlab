package gg.overlab.backend.seo;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class SiteUrl {

    private final String base;

    public SiteUrl(@Value("${app.frontend-url}") String frontendUrl) {
        this.base = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    }

    public String base() {
        return base;
    }

    public String absolute(String path) {
        return base + path;
    }
}
