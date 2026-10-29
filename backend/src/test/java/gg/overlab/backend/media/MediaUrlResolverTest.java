package gg.overlab.backend.media;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class MediaUrlResolverTest {

    private final MediaUrlResolver resolver = new MediaUrlResolver(new MediaProperties(Path.of("media"), "/media/"));

    @Test
    void prefixesStoredRelativePaths() {
        assertThat(resolver.resolve("heroes/ana.png")).isEqualTo("/media/heroes/ana.png");
    }

    @Test
    void leavesAbsoluteAndRootedUrlsAlone() {
        assertThat(resolver.resolve("https://cdn.example.com/a.png")).isEqualTo("https://cdn.example.com/a.png");
        assertThat(resolver.resolve("/media/heroes/ana.png")).isEqualTo("/media/heroes/ana.png");
    }

    @Test
    void returnsNullWhenThereIsNoImage() {
        assertThat(resolver.resolve(null)).isNull();
        assertThat(resolver.resolve(" ")).isNull();
    }
}
