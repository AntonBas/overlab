package gg.overlab.backend.gamemap;

import gg.overlab.backend.gamemap.dto.MapDto;
import org.springframework.stereotype.Component;

@Component
public class MapMapper {

    public MapDto toDto(GameMap map) {
        return new MapDto(map.getSlug(), map.getName(), map.getMode(), map.getImageUrl());
    }
}
