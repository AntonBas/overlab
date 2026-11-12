package gg.overlab.backend.collector.parser;

import gg.overlab.backend.gamemap.MapMode;

public record ParsedMap(String slug, String name, MapMode mode) {
}
