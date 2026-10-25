package gg.overlab.backend.stats;

import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.stats.dto.HeroMapStatDto;
import gg.overlab.backend.stats.dto.HeroStatDto;
import java.math.BigDecimal;
import org.springframework.stereotype.Component;

@Component
public class StatsMapper {

    public HeroStatDto toDto(HeroStat stat, HeroStat baseline) {
        Hero hero = stat.getHero();
        return new HeroStatDto(
                hero.getSlug(),
                hero.getName(),
                hero.getRole(),
                hero.getSubrole(),
                stat.getWinRate(),
                stat.getPickRate(),
                stat.getBanRate(),
                delta(stat.getWinRate(), baseline == null ? null : baseline.getWinRate()),
                delta(stat.getPickRate(), baseline == null ? null : baseline.getPickRate()),
                delta(stat.getBanRate(), baseline == null ? null : baseline.getBanRate()));
    }

    public HeroMapStatDto toMapDto(HeroStat stat, HeroStat baseline) {
        boolean overall = stat.getMap() == null;
        return new HeroMapStatDto(
                overall ? null : stat.getMap().getSlug(),
                overall ? null : stat.getMap().getName(),
                overall ? null : stat.getMap().getMode(),
                stat.getWinRate(),
                stat.getPickRate(),
                stat.getBanRate(),
                delta(stat.getWinRate(), baseline == null ? null : baseline.getWinRate()),
                delta(stat.getPickRate(), baseline == null ? null : baseline.getPickRate()),
                stat.getCapturedAt());
    }

    private BigDecimal delta(BigDecimal value, BigDecimal baseline) {
        if (value == null || baseline == null) {
            return null;
        }
        return value.subtract(baseline);
    }
}
