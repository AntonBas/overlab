package gg.overlab.backend.collector;

import gg.overlab.backend.gamemap.MapMode;

public record ParsedMap(String slug, String name, MapMode mode) {
}
