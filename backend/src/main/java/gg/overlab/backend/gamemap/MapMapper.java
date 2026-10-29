package gg.overlab.backend.gamemap;

import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.media.MediaUrlResolver;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MapMapper {

    private final MediaUrlResolver mediaUrlResolver;

    public MapDto toDto(GameMap map) {
        return new MapDto(map.getSlug(), map.getName(), map.getMode(),
                mediaUrlResolver.resolve(map.getImageUrl()));
    }
}
