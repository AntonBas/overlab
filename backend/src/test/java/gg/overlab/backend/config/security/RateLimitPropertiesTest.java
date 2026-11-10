package gg.overlab.backend.config.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class RateLimitPropertiesTest {

    @Test
    void defaultsAreHighEnoughForASearchEngineCrawlerRenderingManyPages() {
        RateLimitProperties properties = new RateLimitProperties(0, 0);

        assertThat(properties.apiPerMinute()).isEqualTo(600);
        assertThat(properties.statsPerMinute()).isEqualTo(1200);
    }

    @Test
    void explicitValuesAreKept() {
        RateLimitProperties properties = new RateLimitProperties(3, 5);

        assertThat(properties.apiPerMinute()).isEqualTo(3);
        assertThat(properties.statsPerMinute()).isEqualTo(5);
    }
}
