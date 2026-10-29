package gg.overlab.backend.stats;

import gg.overlab.backend.gamemap.GameMap;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.media.MediaProperties;
import gg.overlab.backend.media.MediaUrlResolver;
import java.math.BigDecimal;
import java.nio.file.Path;
import java.time.Instant;

final class StatsFixtures {

    static final Instant CAPTURED_AT = Instant.parse("2026-10-25T04:00:00Z");

    private StatsFixtures() {
    }

    static StatsMapper statsMapper() {
        return new StatsMapper(new MediaUrlResolver(new MediaProperties(Path.of("media"), "/media")));
    }

    static Hero hero(long id, String slug, String name, HeroRole role) {
        Hero hero = new Hero();
        hero.setId(id);
        hero.setSlug(slug);
        hero.setName(name);
        hero.setRole(role);
        return hero;
    }

    static GameMap map(String slug, String name) {
        GameMap map = new GameMap();
        map.setSlug(slug);
        map.setName(name);
        return map;
    }

    static HeroStat stat(Hero hero, GameMap map, String winRate, String pickRate, String banRate) {
        HeroStat stat = new HeroStat();
        stat.setHero(hero);
        stat.setMap(map);
        stat.setQueue(GameQueue.COMPETITIVE);
        stat.setPlatform(Platform.PC);
        stat.setRegion(Region.EUROPE);
        stat.setTier(RankTier.ALL);
        stat.setWinRate(new BigDecimal(winRate));
        stat.setPickRate(new BigDecimal(pickRate));
        stat.setBanRate(banRate == null ? null : new BigDecimal(banRate));
        stat.setCapturedAt(CAPTURED_AT);
        return stat;
    }
}
