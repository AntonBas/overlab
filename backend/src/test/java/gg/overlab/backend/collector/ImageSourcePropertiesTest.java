package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class ImageSourcePropertiesTest {

    @Test
    void anEmptyListAllowsEveryHost() {
        assertThat(new ImageSourceProperties(List.of()).allows("anything.example")).isTrue();
    }

    @Test
    void allowsTheListedHostAndItsSubdomains() {
        ImageSourceProperties sources = new ImageSourceProperties(List.of("blizzard.com"));

        assertThat(sources.allows("blizzard.com")).isTrue();
        assertThat(sources.allows("Images.Blizzard.com")).isTrue();
    }

    @Test
    void rejectsOtherHostsAndLookAlikes() {
        ImageSourceProperties sources = new ImageSourceProperties(List.of("blizzard.com"));

        assertThat(sources.allows("evil.example")).isFalse();
        assertThat(sources.allows("notblizzard.com")).isFalse();
        assertThat(sources.allows("blizzard.com.evil.example")).isFalse();
    }
}
