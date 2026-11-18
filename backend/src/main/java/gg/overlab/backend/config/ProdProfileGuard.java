package gg.overlab.backend.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
public class ProdProfileGuard {

    private final String frontendUrl;

    public ProdProfileGuard(@Value("${app.frontend-url}") String frontendUrl) {
        this.frontendUrl = frontendUrl;
    }

    @PostConstruct
    void requireSecureAddress() {
        boolean secure = frontendUrl.startsWith("https://");
        boolean localAddress = frontendUrl.matches("^http://(localhost|127\\.0\\.0\\.1)(:\\d+)?/?$");
        if (!secure && !localAddress) {
            throw new IllegalStateException("The prod profile needs an https:// FRONTEND_URL, got " + frontendUrl);
        }
    }
}
