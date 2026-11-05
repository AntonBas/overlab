package gg.overlab.backend.collector;

import gg.overlab.backend.stats.GameFormat;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import java.math.BigDecimal;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

final class CollectorFixtures {

    private CollectorFixtures() {
    }

    static CollectorProperties properties(int maxAttempts, CollectorJob... jobs) {
        return new CollectorProperties("https://overwatch.example", "OverlabTest", Duration.ZERO,
                GameFormat.FIVE_VS_FIVE, null, false, false,
                new CollectorProperties.Retry(maxAttempts, Duration.ZERO),
                new CollectorProperties.Timeouts(Duration.ofSeconds(1), Duration.ofSeconds(1)),
                3, new CollectorProperties.Retention(180), List.of(jobs));
    }

    static CollectorJob job(String name, List<GameQueue> queues, List<RankTier> tiers, List<String> maps) {
        return new CollectorJob(name, "0 0 4 * * *", true, queues, List.of(Platform.PC), List.of(Region.EUROPE), tiers,
                maps, true);
    }

    static List<BlizzardRatesResponse.HeroRate> rates(int count) {
        List<BlizzardRatesResponse.HeroRate> rates = new ArrayList<>();
        for (int index = 0; index < count; index++) {
            rates.add(rate("hero-" + index, "TANK", "50.0", "10.0", "5.0"));
        }
        return rates;
    }

    static BlizzardRatesResponse.HeroRate rate(String id, String role, String win, String pick, String ban) {
        return new BlizzardRatesResponse.HeroRate(id,
                new BlizzardRatesResponse.Cells(id, new BigDecimal(win), new BigDecimal(pick),
                        ban == null ? null : new BigDecimal(ban)),
                new BlizzardRatesResponse.HeroInfo(id, role, "initiator", null, null));
    }

    static final String WITHOUT_BAN_RATE_JSON = """
            {"rates":{"rates":[
              {"id":"ana","cells":{"name":"Ana","winrate":47.1,"pickrate":23.1,"banrate":0},
               "hero":{"name":"Ana","role":"SUPPORT","subrole":"tactician"}}],
              "extrema":{},"selected":{}},
              "columns":[{"id":"name"},{"id":"pickrate"},{"id":"winrate"}]}
            """;

    static final String SAMPLE_JSON = """
            {"rates":{"rates":[
              {"id":"ana","cells":{"name":"Ana","winrate":47.1,"pickrate":23.1,"banrate":11.9},
               "hero":{"name":"Ana","role":"SUPPORT","subrole":"tactician","portrait":"x","color":"48699eff"}},
              {"id":"dva","cells":{"name":"D.Va","winrate":50.2,"pickrate":9.4,"banrate":0},
               "hero":{"name":"D.Va","role":"TANK","subrole":"initiator","portrait":"y"}}],
              "extrema":{},"selected":{}},
              "columns":[{"id":"name"},{"id":"pickrate"},{"id":"winrate"},{"id":"banrate"}]}
            """;
}
