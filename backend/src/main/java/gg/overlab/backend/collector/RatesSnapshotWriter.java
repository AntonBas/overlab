package gg.overlab.backend.collector;

import gg.overlab.backend.gamemap.GameMap;
import gg.overlab.backend.gamemap.GameMapRepository;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.stats.GameFormat;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.HeroStat;
import gg.overlab.backend.stats.HeroStatRepository;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RatesSnapshotWriter {

    public static final String ALL_MAPS = "all-maps";

    private final HeroRepository heroRepository;
    private final GameMapRepository gameMapRepository;
    private final HeroStatRepository heroStatRepository;
    private final SnapshotQualityChecker qualityChecker;
    private final CollectorMetrics metrics;
    private final HeroPortraitDownloader portraitDownloader;
    private final RoleIconDownloader roleIconDownloader;

    @Transactional
    public int save(Instant capturedAt, GameQueue queue, GameFormat gameFormat, Platform platform, Region region,
                    RankTier tier, String mapSlug, List<BlizzardRatesResponse.HeroRate> rates) {
        Map<String, Hero> heroesBySlug = new HashMap<>();
        heroRepository.findAll().forEach(hero -> heroesBySlug.put(hero.getSlug(), hero));
        GameMap map = resolveMap(mapSlug);
        qualityChecker.inspect(capturedAt, queue, gameFormat, platform, region, tier, mapSlug, rates);

        List<HeroStat> stats = new ArrayList<>();
        for (BlizzardRatesResponse.HeroRate rate : rates) {
            Hero hero = heroesBySlug.computeIfAbsent(rate.id(), this::newHero);
            applyHeroDetails(hero, rate);
            hero = heroRepository.save(hero);
            heroesBySlug.put(rate.id(), hero);
            stats.add(toStat(hero, map, queue, gameFormat, platform, region, tier, capturedAt, rate));
        }
        heroStatRepository.saveAll(stats);
        return stats.size();
    }

    private Hero newHero(String slug) {
        log.warn("New hero discovered: {}", slug);
        metrics.recordNewHero(slug);
        return new Hero();
    }

    private void applyHeroDetails(Hero hero, BlizzardRatesResponse.HeroRate rate) {
        hero.setSlug(rate.id());
        hero.setName(rate.hero().name());
        HeroRole role = HeroRole.valueOf(rate.hero().role().toUpperCase(Locale.ROOT));
        if (hero.getRole() != null && hero.getRole() != role) {
            log.warn("Hero {} changed role from {} to {}", hero.getSlug(), hero.getRole(), role);
            metrics.recordRoleChange();
        }
        hero.setRole(role);
        hero.setSubrole(rate.hero().subrole());
        portraitDownloader.ensurePortrait(hero, rate.hero().portrait());
        roleIconDownloader.ensureRoleIcon(rate.hero().role(), rate.hero().roleIcon());
    }

    private HeroStat toStat(Hero hero, GameMap map, GameQueue queue, GameFormat gameFormat, Platform platform,
                            Region region, RankTier tier, Instant capturedAt, BlizzardRatesResponse.HeroRate rate) {
        HeroStat stat = new HeroStat();
        stat.setHero(hero);
        stat.setMap(map);
        stat.setQueue(queue);
        stat.setGameFormat(gameFormat);
        stat.setPlatform(platform);
        stat.setRegion(region);
        stat.setTier(tier);
        stat.setWinRate(rate.cells().winrate());
        stat.setPickRate(rate.cells().pickrate());
        stat.setBanRate(queue == GameQueue.COMPETITIVE ? rate.cells().banrate() : null);
        stat.setCapturedAt(capturedAt);
        return stat;
    }

    private GameMap resolveMap(String mapSlug) {
        if (ALL_MAPS.equals(mapSlug)) {
            return null;
        }
        return gameMapRepository.findBySlug(mapSlug).orElseGet(() -> {
            log.warn("New map discovered: {}, set its mode and image in the admin panel", mapSlug);
            metrics.recordNewMap(mapSlug);
            GameMap map = new GameMap();
            map.setSlug(mapSlug);
            map.setName(humanReadable(mapSlug));
            return gameMapRepository.save(map);
        });
    }

    private String humanReadable(String slug) {
        StringBuilder name = new StringBuilder();
        for (String part : slug.split("-")) {
            if (!name.isEmpty()) {
                name.append(' ');
            }
            name.append(Character.toUpperCase(part.charAt(0))).append(part.substring(1));
        }
        return name.toString();
    }
}
