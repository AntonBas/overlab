package gg.overlab.backend.gamemap.dto;

import gg.overlab.backend.gamemap.MapMode;
import java.io.Serializable;

public record MapDto(String slug, String name, MapMode mode, String imageUrl) implements Serializable {
}
