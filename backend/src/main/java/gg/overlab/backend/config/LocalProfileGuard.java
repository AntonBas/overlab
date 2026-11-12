package gg.overlab.backend.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
public class LocalProfileGuard {

    private final String frontendUrl;

    public LocalProfileGuard(@Value("${app.frontend-url}") String frontendUrl) {
        this.frontendUrl = frontendUrl;
    }

    @PostConstruct
    void rejectProductionAddress() {
        if (frontendUrl.startsWith("https://")) {
            throw new IllegalStateException("The local profile is active but FRONTEND_URL is " + frontendUrl
                    + "; set SPRING_PROFILES_ACTIVE=prod");
        }
    }
}
