package gg.overlab.backend.seo;

import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.hero.dto.HeroDto;
import gg.overlab.backend.patch.PatchService;
import gg.overlab.backend.patch.dto.PatchDto;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import gg.overlab.backend.stats.StatsHistoryService;
import gg.overlab.backend.stats.StatsService;
import gg.overlab.backend.stats.StatsSort;
import gg.overlab.backend.stats.dto.HeroChangeDto;
import gg.overlab.backend.stats.dto.HeroMapStatDto;
import gg.overlab.backend.stats.dto.HeroStatDto;
import gg.overlab.backend.stats.dto.StatsFilter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import org.springframework.stereotype.Component;

@Component
public class SeoStatsContent {

    static final String DATA_SCOPE = "Competitive, all ranks, PC, Europe";

    private static final int TOP_HEROES = 5;
    private static final BigDecimal MIN_PICK_RATE = new BigDecimal("3");

    private final StatsService statsService;
    private final StatsHistoryService historyService;
    private final PatchService patchService;

    public SeoStatsContent(StatsService statsService, StatsHistoryService historyService,
                           PatchService patchService) {
        this.statsService = statsService;
        this.historyService = historyService;
        this.patchService = patchService;
    }

    List<SeoSection> overview() {
        List<HeroStatDto> heroes = competitiveHeroes(StatsFilter.ALL_MAPS);
        if (heroes.isEmpty()) {
            return List.of();
        }
        List<SeoSection> sections = new ArrayList<>();
        add(sections, "About these numbers", List.of(SeoItem.plain("The numbers on this page are for "
                + DATA_SCOPE + ". The live page can filter by rank, map, region and platform.")));
        add(sections, "Highest win rate (" + DATA_SCOPE + ")",
                topItems(heroes.stream().filter(this::isRegularlyPicked).toList(), HeroStatDto::winRate));
        add(sections, "Most picked heroes", topItems(heroes, HeroStatDto::pickRate));
        add(sections, "Most banned heroes", topItems(heroes, HeroStatDto::banRate));
        add(sections, "All heroes: win, pick and ban rates (" + DATA_SCOPE + ")",
                heroes.stream().map(this::heroRatesItem).toList());
        return sections;
    }

    Optional<SeoSection> heroRates(HeroDto hero) {
        return competitiveHeroes(StatsFilter.ALL_MAPS).stream()
                .filter(stat -> stat.heroSlug().equals(hero.slug())).findFirst()
                .map(stat -> new SeoSection(hero.name() + " statistics", List.of(SeoItem.plain(
                        hero.name() + " in " + DATA_SCOPE + ": " + ratesText(stat) + "."))));
    }

    List<SeoSection> mapRankings(MapDto map) {
        List<HeroStatDto> heroes = competitiveHeroes(map.slug()).stream()
                .filter(hero -> hero.winRateDelta() != null && isRegularlyPicked(hero)).toList();
        List<SeoSection> sections = new ArrayList<>();
        if (heroes.isEmpty()) {
            return sections;
        }
        add(sections, "Biggest win rate gain on " + map.name(),
                topMapItems(heroes, HeroStatDto::winRateDelta, true));
        add(sections, "Highest win rate on " + map.name(), topMapItems(heroes, HeroStatDto::winRate, true));
        add(sections, "Weakest picks on " + map.name(), topMapItems(heroes, HeroStatDto::winRateDelta, false));
        return sections;
    }

    List<SeoSection> heroMapRankings(HeroDto hero) {
        List<HeroMapStatDto> maps;
        try {
            maps = statsService.getHeroByMaps(hero.slug(), GameQueue.COMPETITIVE, RankTier.ALL, Platform.PC,
                    Region.EUROPE).maps().stream().filter(map -> map.winRateDelta() != null).toList();
        } catch (EntityNotFoundException exception) {
            return List.of();
        }
        if (maps.isEmpty()) {
            return List.of();
        }
        List<HeroMapStatDto> ranked = maps.stream()
                .sorted(Comparator.comparing(HeroMapStatDto::winRateDelta).reversed()).toList();
        int shown = Math.min(TOP_HEROES, ranked.size());
        List<SeoSection> sections = new ArrayList<>();
        HeroMapStatDto best = ranked.getFirst();
        HeroMapStatDto worst = ranked.getLast();
        add(sections, hero.name() + " on maps", List.of(SeoItem.plain(hero.name() + " is strongest on "
                + best.mapName() + " (" + percent(best.winRate()) + " win rate) and weakest on " + worst.mapName()
                + " (" + percent(worst.winRate()) + " win rate), across " + ranked.size() + " maps in "
                + DATA_SCOPE + ".")));
        add(sections, "Best maps for " + hero.name(), ranked.subList(0, shown).stream().map(this::mapItem).toList());
        add(sections, "Weakest maps for " + hero.name(),
                ranked.reversed().subList(0, shown).stream().map(this::mapItem).toList());
        return sections;
    }

    List<SeoSection> latestPatchChanges() {
        List<PatchDto> patches = patchService.findAll();
        if (patches.isEmpty()) {
            return List.of();
        }
        PatchDto patch = patches.getFirst();
        List<HeroChangeDto> heroes;
        try {
            heroes = historyService.compareAroundPatch(filter(StatsFilter.ALL_MAPS), patch.slug()).heroes().stream()
                    .filter(hero -> hero.winRateChange() != null && hero.pickRateAfter() != null
                            && hero.pickRateAfter().compareTo(MIN_PICK_RATE) >= 0)
                    .toList();
        } catch (EntityNotFoundException exception) {
            return List.of();
        }
        String name = patch.title() == null || patch.title().isBlank() ? "patch " + patch.version() : patch.title();
        List<SeoSection> sections = new ArrayList<>();
        add(sections, "Biggest win rate gains after " + name, changeItems(heroes, true));
        add(sections, "Biggest win rate drops after " + name, changeItems(heroes, false));
        return sections;
    }

    private List<SeoItem> changeItems(List<HeroChangeDto> heroes, boolean gains) {
        return heroes.stream()
                .filter(hero -> gains ? hero.winRateChange().signum() > 0 : hero.winRateChange().signum() < 0)
                .sorted(gains ? Comparator.comparing(HeroChangeDto::winRateChange).reversed()
                        : Comparator.comparing(HeroChangeDto::winRateChange))
                .limit(TOP_HEROES)
                .map(hero -> SeoItem.link(hero.heroName() + ": " + percent(hero.winRateBefore()) + " to "
                        + percent(hero.winRateAfter()) + " win rate (" + signed(hero.winRateChange()) + ")",
                        "/heroes/" + hero.heroSlug()))
                .toList();
    }

    private StatsFilter filter(String mapSlug) {
        return StatsFilter.of(GameQueue.COMPETITIVE, RankTier.ALL, mapSlug, Platform.PC, Region.EUROPE);
    }

    private List<HeroStatDto> competitiveHeroes(String mapSlug) {
        try {
            return statsService.getStats(filter(mapSlug), null, StatsSort.PICK_RATE, true).heroes();
        } catch (EntityNotFoundException exception) {
            return List.of();
        }
    }

    private boolean isRegularlyPicked(HeroStatDto hero) {
        return hero.pickRate() != null && hero.pickRate().compareTo(MIN_PICK_RATE) >= 0;
    }

    private List<SeoItem> topItems(List<HeroStatDto> heroes, Function<HeroStatDto, BigDecimal> rate) {
        return heroes.stream().filter(hero -> rate.apply(hero) != null)
                .sorted(Comparator.comparing(rate, Comparator.<BigDecimal>reverseOrder()))
                .limit(TOP_HEROES).map(this::heroRatesItem).toList();
    }

    private List<SeoItem> topMapItems(List<HeroStatDto> heroes, Function<HeroStatDto, BigDecimal> rate,
                                      boolean highestFirst) {
        Comparator<BigDecimal> order = highestFirst ? Comparator.reverseOrder() : Comparator.naturalOrder();
        return heroes.stream().sorted(Comparator.comparing(rate, order)).limit(TOP_HEROES)
                .map(hero -> SeoItem.link(hero.heroName() + ": " + percent(hero.winRate()) + " win rate ("
                        + signed(hero.winRateDelta()) + " compared with the hero's average), "
                        + percent(hero.pickRate()) + " pick rate", "/heroes/" + hero.heroSlug()))
                .toList();
    }

    private SeoItem heroRatesItem(HeroStatDto hero) {
        return SeoItem.link(hero.heroName() + ": " + ratesText(hero), "/heroes/" + hero.heroSlug());
    }

    private String ratesText(HeroStatDto hero) {
        String ban = hero.banRate() == null ? "" : ", " + percent(hero.banRate()) + " ban rate";
        return percent(hero.winRate()) + " win rate, " + percent(hero.pickRate()) + " pick rate" + ban;
    }

    private SeoItem mapItem(HeroMapStatDto map) {
        return SeoItem.link(map.mapName() + SeoContentBuilder.modeSuffix(map.mode()) + ": "
                + percent(map.winRate()) + " win rate (" + signed(map.winRateDelta())
                + " compared with the hero's average)", "/maps/" + map.mapSlug());
    }

    private String percent(BigDecimal value) {
        return value == null ? "n/a" : value.setScale(1, RoundingMode.HALF_UP) + "%";
    }

    private String signed(BigDecimal value) {
        BigDecimal rounded = value.setScale(1, RoundingMode.HALF_UP);
        return (rounded.signum() > 0 ? "+" : "") + rounded;
    }

    private void add(List<SeoSection> sections, String heading, List<SeoItem> items) {
        if (!items.isEmpty()) {
            sections.add(new SeoSection(heading, items));
        }
    }
}
