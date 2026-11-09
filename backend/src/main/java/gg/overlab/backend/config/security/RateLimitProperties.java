package gg.overlab.backend.config.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.rate-limit")
public record RateLimitProperties(int apiPerMinute, int statsPerMinute) {

    private static final int DEFAULT_API_PER_MINUTE = 120;
    private static final int DEFAULT_STATS_PER_MINUTE = 300;

    public RateLimitProperties {
        if (apiPerMinute <= 0) {
            apiPerMinute = DEFAULT_API_PER_MINUTE;
        }
        if (statsPerMinute <= 0) {
            statsPerMinute = DEFAULT_STATS_PER_MINUTE;
        }
    }
}
