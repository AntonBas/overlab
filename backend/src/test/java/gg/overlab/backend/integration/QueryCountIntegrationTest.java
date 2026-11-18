package gg.overlab.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.guide.Guide;
import gg.overlab.backend.guide.GuideRepository;
import gg.overlab.backend.guide.GuideService;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.hero.HeroService;
import gg.overlab.backend.hero.perk.Perk;
import gg.overlab.backend.hero.perk.PerkRecommendation;
import gg.overlab.backend.hero.perk.PerkRepository;
import gg.overlab.backend.hero.perk.PerkService;
import gg.overlab.backend.hero.perk.PerkSlot;
import gg.overlab.backend.hero.relation.HeroRelation;
import gg.overlab.backend.hero.relation.HeroRelationRepository;
import gg.overlab.backend.hero.relation.HeroRelationService;
import gg.overlab.backend.hero.relation.RelationType;
import gg.overlab.backend.stats.GameFormat;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.HeroStat;
import gg.overlab.backend.stats.HeroStatRepository;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import gg.overlab.backend.stats.StatsService;
import gg.overlab.backend.stats.StatsSort;
import gg.overlab.backend.stats.dto.StatsFilter;
import jakarta.persistence.EntityManager;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
@TestPropertySource(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
class QueryCountIntegrationTest {

    private static final int SMALL_DATA_SET = 3;
    private static final int LARGE_DATA_SET = 12;

    @Autowired
    private HeroRepository heroRepository;

    @Autowired
    private HeroRelationRepository relationRepository;

    @Autowired
    private PerkRepository perkRepository;

    @Autowired
    private GuideRepository guideRepository;

    @Autowired
    private HeroStatRepository statRepository;

    @Autowired
    private HeroRelationService relationService;

    @Autowired
    private PerkService perkService;

    @Autowired
    private GuideService guideService;

    @Autowired
    private HeroService heroService;

    @Autowired
    private StatsService statsService;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private CacheManager cacheManager;

    private final List<Hero> heroes = new ArrayList<>();

    @Test
    void queryCountDoesNotGrowWithTheNumberOfHeroes() {
        Map<String, Supplier<Object>> scenarios = scenarios();

        Map<String, Long> small = measure(scenarios, SMALL_DATA_SET);
        Map<String, Long> large = measure(scenarios, LARGE_DATA_SET);

        assertThat(large).isEqualTo(small);
    }

    private Map<String, Supplier<Object>> scenarios() {
        Map<String, Supplier<Object>> scenarios = new LinkedHashMap<>();
        scenarios.put("all relations", relationService::findAllRelations);
        scenarios.put("counters", () -> relationService.getCounters(heroes.get(0).getSlug()));
        scenarios.put("synergies", () -> relationService.getSynergies(heroes.get(0).getSlug()));
        scenarios.put("perks", perkService::findAll);
        scenarios.put("published guides", () -> guideService.findPublished(null, null));
        scenarios.put("admin guides", guideService::findAllForAdmin);
        scenarios.put("heroes", heroService::findAll);
        scenarios.put("stats snapshot", () -> statsService.getStats(filter(), null, StatsSort.PICK_RATE, true));
        return scenarios;
    }

    private Map<String, Long> measure(Map<String, Supplier<Object>> scenarios, int heroCount) {
        while (heroes.size() < heroCount) {
            addHeroWithContent(heroes.size());
        }
        entityManager.flush();
        Statistics statistics = entityManager.getEntityManagerFactory().unwrap(SessionFactory.class).getStatistics();
        Map<String, Long> counts = new LinkedHashMap<>();
        scenarios.forEach((name, call) -> {
            entityManager.clear();
            CacheTestSupport.clearAll(cacheManager);
            statistics.clear();
            call.get();
            counts.put(name, statistics.getPrepareStatementCount());
        });
        return counts;
    }

    private StatsFilter filter() {
        return StatsFilter.of(GameQueue.QUICK_PLAY, RankTier.ALL, StatsFilter.ALL_MAPS, Platform.PC, Region.EUROPE);
    }

    private void addHeroWithContent(int index) {
        Hero hero = new Hero();
        hero.setSlug("query-count-" + index);
        hero.setName("Query Count " + index);
        hero.setRole(HeroRole.values()[index % HeroRole.values().length]);
        heroes.add(heroRepository.save(hero));
        if (index > 0) {
            saveRelation(heroes.get(index), heroes.get(index - 1), RelationType.COUNTER);
            saveRelation(heroes.get(index - 1), heroes.get(index), RelationType.SYNERGY);
        }
        savePerk(hero, index);
        saveGuide(hero, index);
        saveStat(hero);
    }

    private void saveRelation(Hero hero, Hero relatedHero, RelationType type) {
        HeroRelation relation = new HeroRelation();
        relation.setHero(hero);
        relation.setRelatedHero(relatedHero);
        relation.setType(type);
        relationRepository.save(relation);
    }

    private void savePerk(Hero hero, int index) {
        Perk perk = new Perk();
        perk.setHero(hero);
        perk.setName("Perk " + index);
        perk.setSlot(PerkSlot.MINOR);
        perk.setRecommendation(PerkRecommendation.RECOMMENDED);
        perkRepository.save(perk);
    }

    private void saveGuide(Hero hero, int index) {
        Guide guide = new Guide();
        guide.setHero(hero);
        guide.setSlug("query-count-guide-" + index);
        guide.setTitle("Guide " + index);
        guide.setYoutubeId("abcdefghijk");
        guide.setPublished(true);
        guideRepository.save(guide);
    }

    private void saveStat(Hero hero) {
        HeroStat stat = new HeroStat();
        stat.setHero(hero);
        stat.setQueue(GameQueue.QUICK_PLAY);
        stat.setGameFormat(GameFormat.FIVE_VS_FIVE);
        stat.setPlatform(Platform.PC);
        stat.setRegion(Region.EUROPE);
        stat.setTier(RankTier.ALL);
        stat.setWinRate(new BigDecimal("50.00"));
        stat.setPickRate(new BigDecimal("10.00"));
        stat.setCapturedAt(Instant.parse("2030-01-01T00:00:00Z"));
        statRepository.save(stat);
    }
}
