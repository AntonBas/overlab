package gg.overlab.backend.stats;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.stats.dto.HeroChangeDto;
import java.math.BigDecimal;
import org.junit.jupiter.api.Test;

class StatsMapperTest {

    private final StatsMapper mapper = new StatsMapper();

    @Test
    void changeIsTheDifferenceBetweenAfterAndBefore() {
        Hero hero = new Hero();
        hero.setSlug("ana");
        hero.setName("Ana");
        hero.setRole(HeroRole.SUPPORT);

        HeroChangeDto change = mapper.toChangeDto(stat(hero, "47.10", "20.00", "10.00"),
                stat(hero, "45.60", "24.50", "10.00"));

        assertThat(change.winRateChange()).isEqualByComparingTo("-1.50");
        assertThat(change.pickRateChange()).isEqualByComparingTo("4.50");
        assertThat(change.banRateChange()).isEqualByComparingTo("0");
        assertThat(change.winRateBefore()).isEqualByComparingTo("47.10");
        assertThat(change.winRateAfter()).isEqualByComparingTo("45.60");
    }

    @Test
    void missingBanRateGivesNoBanChange() {
        Hero hero = new Hero();
        hero.setSlug("ana");
        hero.setName("Ana");
        hero.setRole(HeroRole.SUPPORT);

        HeroChangeDto change = mapper.toChangeDto(stat(hero, "47.10", "20.00", null),
                stat(hero, "47.10", "20.00", "3.00"));

        assertThat(change.banRateChange()).isNull();
    }

    private HeroStat stat(Hero hero, String winRate, String pickRate, String banRate) {
        HeroStat stat = new HeroStat();
        stat.setHero(hero);
        stat.setWinRate(new BigDecimal(winRate));
        stat.setPickRate(new BigDecimal(pickRate));
        stat.setBanRate(banRate == null ? null : new BigDecimal(banRate));
        return stat;
    }
}
