package gg.overlab.backend.gamemap;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.media.MediaProperties;
import gg.overlab.backend.media.MediaUrlResolver;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

class MapMapperTest {

    private final MapMapper mapper = new MapMapper(new MediaUrlResolver(new MediaProperties(Path.of("media"), "/media/")));

    @Test
    void resolvesStoredImagePathsAgainstTheMediaBaseUrl() {
        MapDto dto = mapper.toDto(map("busan", "Busan", MapMode.CONTROL, "maps/busan-1.png"));

        assertThat(dto.slug()).isEqualTo("busan");
        assertThat(dto.name()).isEqualTo("Busan");
        assertThat(dto.mode()).isEqualTo(MapMode.CONTROL);
        assertThat(dto.imageUrl()).isEqualTo("/media/maps/busan-1.png");
    }

    @Test
    void keepsAbsoluteUrlsAndMissingImages() {
        assertThat(mapper.toDto(map("a", "A", null, "https://cdn.example/a.png")).imageUrl())
                .isEqualTo("https://cdn.example/a.png");
        assertThat(mapper.toDto(map("b", "B", null, null)).imageUrl()).isNull();
    }

    private GameMap map(String slug, String name, MapMode mode, String imageUrl) {
        GameMap map = new GameMap();
        map.setSlug(slug);
        map.setName(name);
        map.setMode(mode);
        map.setImageUrl(imageUrl);
        return map;
    }
}
