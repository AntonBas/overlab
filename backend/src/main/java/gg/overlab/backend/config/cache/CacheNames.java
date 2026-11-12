package gg.overlab.backend.config.cache;

import java.util.List;

public final class CacheNames {

    public static final String CONTENT = "content";
    public static final String HEROES = "heroes";
    public static final String MAPS = "maps";
    public static final String STATS = "stats";
    public static final List<String> ALL = List.of(CONTENT, HEROES, MAPS, STATS);

    private CacheNames() {
    }
}
