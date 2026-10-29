package gg.overlab.backend.stats;

import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.stats.dto.HeroChangeDto;
import gg.overlab.backend.stats.dto.HeroHistoryPointDto;
import gg.overlab.backend.stats.dto.HeroMapStatDto;
import gg.overlab.backend.stats.dto.HeroStatDto;
import gg.overlab.backend.media.MediaUrlResolver;
import java.math.BigDecimal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StatsMapper {

    private final MediaUrlResolver mediaUrlResolver;

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
                delta(stat.getBanRate(), baseline == null ? null : baseline.getBanRate()),
                mediaUrlResolver.resolve(hero.getPortraitUrl()));
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

    public HeroHistoryPointDto toHistoryPoint(HeroStat stat) {
        return new HeroHistoryPointDto(stat.getCapturedAt(), stat.getWinRate(), stat.getPickRate(),
                stat.getBanRate());
    }

    public HeroChangeDto toChangeDto(HeroStat before, HeroStat after) {
        Hero hero = after.getHero();
        return new HeroChangeDto(
                hero.getSlug(),
                hero.getName(),
                hero.getRole(),
                before.getWinRate(),
                after.getWinRate(),
                delta(after.getWinRate(), before.getWinRate()),
                before.getPickRate(),
                after.getPickRate(),
                delta(after.getPickRate(), before.getPickRate()),
                before.getBanRate(),
                after.getBanRate(),
                delta(after.getBanRate(), before.getBanRate()),
                mediaUrlResolver.resolve(hero.getPortraitUrl()));
    }

    private BigDecimal delta(BigDecimal value, BigDecimal baseline) {
        if (value == null || baseline == null) {
            return null;
        }
        return value.subtract(baseline);
    }
}
