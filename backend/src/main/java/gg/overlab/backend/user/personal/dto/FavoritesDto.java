package gg.overlab.backend.user.personal.dto;

import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.hero.dto.HeroDto;
import java.util.List;

public record FavoritesDto(List<HeroDto> heroes, List<MapDto> maps) {
}
