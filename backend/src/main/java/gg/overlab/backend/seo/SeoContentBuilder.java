package gg.overlab.backend.seo;

import gg.overlab.backend.gamemap.MapMode;
import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.guide.GuideService;
import gg.overlab.backend.guide.dto.GuideDto;
import gg.overlab.backend.gamemap.MapService;
import gg.overlab.backend.hero.HeroService;
import gg.overlab.backend.hero.ability.AbilityService;
import gg.overlab.backend.hero.dto.HeroDto;
import gg.overlab.backend.hero.perk.PerkService;
import gg.overlab.backend.hero.perk.dto.PerkDto;
import gg.overlab.backend.hero.relation.HeroRelationService;
import gg.overlab.backend.hero.relation.dto.HeroCountersDto;
import gg.overlab.backend.hero.relation.dto.RelatedHeroDto;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import gg.overlab.backend.stats.StatsService;
import gg.overlab.backend.stats.StatsSort;
import gg.overlab.backend.stats.dto.HeroMapStatDto;
import gg.overlab.backend.stats.dto.HeroStatDto;
import gg.overlab.backend.stats.dto.StatsFilter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class SeoContentBuilder {

    static final int MIN_GUIDES_FOR_LIST = 2;
    private static final int LATEST_GUIDES = 10;
    private static final int TOP_HEROES = 5;
    private static final BigDecimal MIN_PICK_RATE = new BigDecimal("3");
    private static final Pattern LINK_MARKUP = Pattern.compile("\\[\\[[^\\]/]+/([^\\]]+)]]");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private static final Pattern LIST_MARKER = Pattern.compile("^[-*•\\s]+");

    private final HeroService heroService;
    private final MapService mapService;
    private final AbilityService abilityService;
    private final PerkService perkService;
    private final HeroRelationService relationService;
    private final StatsService statsService;
    private final GuideService guideService;

    public SeoContentBuilder(HeroService heroService, MapService mapService, AbilityService abilityService,
                             PerkService perkService, HeroRelationService relationService,
                             StatsService statsService, GuideService guideService) {
        this.statsService = statsService;
        this.guideService = guideService;
        this.heroService = heroService;
        this.mapService = mapService;
        this.abilityService = abilityService;
        this.perkService = perkService;
        this.relationService = relationService;
    }

    static String readable(String text) {
        String withoutLinks = LINK_MARKUP.matcher(text == null ? "" : text)
                .replaceAll(match -> Matcher.quoteReplacement(match.group(1).replace('-', ' ')));
        return WHITESPACE.matcher(withoutLinks).replaceAll(" ").trim();
    }

    List<SeoSection> heroList() {
        List<SeoItem> items = heroService.findAll().stream()
                .map(hero -> SeoItem.link(hero.name() + " (" + roleName(hero) + ")", "/heroes/" + hero.slug()))
                .toList();
        return List.of(new SeoSection("Heroes", items));
    }

    List<SeoSection> statsOverview() {
        List<SeoSection> sections = new ArrayList<>();
        add(sections, "What the statistics show", List.of(
                SeoItem.plain("Win rate: the share of games a hero wins."),
                SeoItem.plain("Pick rate: how often a hero is chosen."),
                SeoItem.plain("Ban rate: how often a hero is banned in Competitive."),
                SeoItem.plain("Filter by rank, map, region and platform.")));
        List<HeroStatDto> heroes = competitiveHeroes(StatsFilter.ALL_MAPS);
        if (heroes.isEmpty()) {
            add(sections, "Hero statistics", heroService.findAll().stream()
                    .map(hero -> SeoItem.link(hero.name() + " win, pick and ban rates", "/heroes/" + hero.slug()))
                    .toList());
            return sections;
        }
        List<HeroStatDto> regulars = heroes.stream().filter(this::isRegularlyPicked).toList();
        add(sections, "Highest win rate in Competitive", topItems(regulars, HeroStatDto::winRate));
        add(sections, "Most picked heroes", topItems(heroes, HeroStatDto::pickRate));
        add(sections, "Most banned heroes", topItems(heroes.stream().filter(hero -> hero.banRate() != null).toList(),
                HeroStatDto::banRate));
        add(sections, "All heroes: win, pick and ban rates (Competitive, all ranks)",
                heroes.stream().map(this::heroRatesItem).toList());
        return sections;
    }

    List<SeoSection> countersOverview() {
        List<SeoSection> sections = new ArrayList<>();
        add(sections, "Counters and synergies by hero", heroService.findAll().stream()
                .filter(hero -> !heroCounters(hero).isEmpty())
                .map(hero -> SeoItem.link(hero.name() + " counters and synergies",
                        "/heroes/" + hero.slug() + "/counters"))
                .toList());
        if (sections.isEmpty()) {
            return heroList();
        }
        add(sections, "About this data", List.of(SeoItem.plain(
                "Counters and synergies are curated recommendations, not statistics.")));
        return sections;
    }

    List<SeoSection> perksOverview() {
        List<SeoSection> sections = new ArrayList<>();
        add(sections, "Perks by hero", heroService.findAll().stream()
                .filter(hero -> !heroPerks(hero).isEmpty())
                .map(hero -> SeoItem.link(hero.name() + " perks", "/heroes/" + hero.slug() + "/perks"))
                .toList());
        return sections.isEmpty() ? heroList() : sections;
    }

    List<SeoSection> changesOverview() {
        List<SeoSection> sections = new ArrayList<>();
        add(sections, "What changed", List.of(
                SeoItem.plain("Heroes that gained or lost win rate between patches."),
                SeoItem.plain("Heroes that gained or lost pick rate between patches."),
                SeoItem.plain("Trends over the last weeks.")));
        sections.addAll(heroList());
        return sections;
    }

    List<SeoSection> mapList() {
        List<SeoItem> items = mapService.findAll().stream()
                .map(map -> SeoItem.link(map.name() + modeSuffix(map.mode()), "/maps/" + map.slug()))
                .toList();
        return List.of(new SeoSection("Maps", items));
    }

    List<SeoSection> heroDetails(HeroDto hero) {
        List<SeoSection> sections = new ArrayList<>();
        competitiveHeroes(StatsFilter.ALL_MAPS).stream().filter(stat -> stat.heroSlug().equals(hero.slug()))
                .findFirst().ifPresent(stat -> add(sections, hero.name() + " statistics", List.of(SeoItem.plain(
                        hero.name() + " in Competitive, all ranks: " + ratesText(stat) + "."))));
        add(sections, "Strengths", lines(hero.strengths()));
        add(sections, "Weaknesses", lines(hero.weaknesses()));
        add(sections, "Abilities", abilityService.findByHero(hero.slug()).stream()
                .map(ability -> SeoItem.plain(ability.name() + ": " + readable(ability.description()))).toList());
        add(sections, "Best " + hero.name() + " perks", perkService.findByHero(hero.slug()).stream()
                .map(this::perkItem).toList());
        sections.addAll(relationSections(hero));
        return sections;
    }

    List<SeoSection> heroCounters(HeroDto hero) {
        List<SeoSection> sections = relationSections(hero);
        if (!sections.isEmpty()) {
            add(sections, "More about " + hero.name(),
                    List.of(SeoItem.link(hero.name() + " stats, perks and best maps", "/heroes/" + hero.slug())));
        }
        return sections;
    }

    List<SeoSection> heroMaps(HeroDto hero) {
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
        int shown = Math.min(5, ranked.size());
        List<SeoSection> sections = new ArrayList<>();
        add(sections, "Best maps for " + hero.name(), ranked.subList(0, shown).stream().map(this::mapItem).toList());
        add(sections, "Weakest maps for " + hero.name(),
                ranked.reversed().subList(0, shown).stream().map(this::mapItem).toList());
        add(sections, "More about " + hero.name(),
                List.of(SeoItem.link(hero.name() + " stats, perks and counters", "/heroes/" + hero.slug())));
        return sections;
    }

    private SeoItem mapItem(HeroMapStatDto map) {
        return SeoItem.link(map.mapName() + modeSuffix(map.mode()) + ": " + percent(map.winRate()) + " win rate ("
                + signed(map.winRateDelta()) + " compared with the hero's average)", "/maps/" + map.mapSlug());
    }

    private String percent(BigDecimal value) {
        return value == null ? "n/a" : value.setScale(1, RoundingMode.HALF_UP) + "%";
    }

    private String signed(BigDecimal value) {
        BigDecimal rounded = value.setScale(1, RoundingMode.HALF_UP);
        return (rounded.signum() > 0 ? "+" : "") + rounded;
    }

    private List<SeoSection> relationSections(HeroDto hero) {
        List<SeoSection> sections = new ArrayList<>();
        HeroCountersDto counters = relationService.getCounters(hero.slug());
        add(sections, "Heroes " + hero.name() + " is strong against", relatedItems(counters.counters()));
        add(sections, "Heroes that counter " + hero.name(), relatedItems(counters.counteredBy()));
        add(sections, "Heroes that work well with " + hero.name(),
                relatedItems(relationService.getSynergies(hero.slug())));
        return sections;
    }

    List<SeoSection> heroPerks(HeroDto hero) {
        List<SeoSection> sections = new ArrayList<>();
        add(sections, "Best " + hero.name() + " perks", perkService.findByHero(hero.slug()).stream()
                .map(this::perkItem).toList());
        if (!sections.isEmpty()) {
            add(sections, "More about " + hero.name(),
                    List.of(SeoItem.link(hero.name() + " stats, counters and best maps", "/heroes/" + hero.slug())));
        }
        return sections;
    }

    List<SeoSection> heroGuides(HeroDto hero) {
        List<SeoSection> sections = new ArrayList<>();
        List<GuideDto> guides = guideService.findPublished(hero.slug(), null);
        if (guides.size() < MIN_GUIDES_FOR_LIST) {
            return sections;
        }
        add(sections, hero.name() + " video guides", guides.stream()
                .map(guide -> guideItem(guide, guide.mapName())).toList());
        if (!sections.isEmpty()) {
            add(sections, "More about " + hero.name(),
                    List.of(SeoItem.link(hero.name() + " stats, perks, counters and best maps",
                            "/heroes/" + hero.slug())));
        }
        return sections;
    }

    List<SeoSection> mapGuides(MapDto map) {
        List<SeoSection> sections = new ArrayList<>();
        List<GuideDto> guides = guideService.findPublished(null, map.slug());
        if (guides.size() < MIN_GUIDES_FOR_LIST) {
            return sections;
        }
        add(sections, map.name() + " video guides", guides.stream()
                .map(guide -> guideItem(guide, guide.heroName())).toList());
        if (!sections.isEmpty()) {
            add(sections, "More about " + map.name(),
                    List.of(SeoItem.link(map.name() + " hero statistics", "/maps/" + map.slug())));
        }
        return sections;
    }

    List<SeoSection> guideHub() {
        List<GuideDto> guides = guideService.findPublished(null, null);
        List<SeoSection> sections = new ArrayList<>();
        add(sections, "Latest guides", guides.stream()
                .sorted(Comparator.comparing(GuideDto::createdAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(LATEST_GUIDES)
                .map(guide -> guideItem(guide, guide.heroName())).toList());
        add(sections, "Guides by hero", groupItems(guides, GuideDto::heroSlug, GuideDto::heroName, "/heroes/"));
        add(sections, "Guides by map", groupItems(guides, GuideDto::mapSlug, GuideDto::mapName, "/maps/"));
        return sections;
    }

    private List<SeoItem> groupItems(List<GuideDto> guides, Function<GuideDto, String> slugOf,
                                     Function<GuideDto, String> nameOf, String basePath) {
        Map<String, Integer> counts = new LinkedHashMap<>();
        Map<String, String> names = new LinkedHashMap<>();
        Map<String, String> firstPaths = new LinkedHashMap<>();
        for (GuideDto guide : guides) {
            String slug = slugOf.apply(guide);
            if (slug == null) {
                continue;
            }
            counts.merge(slug, 1, Integer::sum);
            names.putIfAbsent(slug, nameOf.apply(guide));
            firstPaths.putIfAbsent(slug, guide.path());
        }
        return counts.keySet().stream()
                .sorted(Comparator.comparing(names::get))
                .map(slug -> counts.get(slug) >= MIN_GUIDES_FOR_LIST
                        ? SeoItem.link(names.get(slug) + " guides (" + counts.get(slug) + ")",
                                basePath + slug + "/guides")
                        : SeoItem.link(names.get(slug) + " guide", "/guides/" + firstPaths.get(slug)))
                .toList();
    }

    private SeoItem guideItem(GuideDto guide, String context) {
        return SeoItem.link(guide.title() + (context == null ? "" : " (" + context + ")"), "/guides/" + guide.path());
    }

    List<SeoSection> mapDetails(MapDto map) {
        List<SeoSection> sections = new ArrayList<>();
        if (map.mode() != null) {
            add(sections, "Game mode", List.of(SeoItem.plain(map.mode().name())));
        }
        List<HeroStatDto> heroes = competitiveHeroes(map.slug()).stream()
                .filter(hero -> hero.winRateDelta() != null && isRegularlyPicked(hero)).toList();
        if (heroes.isEmpty()) {
            return sections;
        }
        add(sections, "Biggest win rate gain on " + map.name(),
                topMapItems(heroes, HeroStatDto::winRateDelta, true));
        add(sections, "Highest win rate on " + map.name(), topMapItems(heroes, HeroStatDto::winRate, true));
        add(sections, "Weakest picks on " + map.name(), topMapItems(heroes, HeroStatDto::winRateDelta, false));
        add(sections, "More statistics", List.of(SeoItem.link("Hero statistics on all maps", "/stats"),
                SeoItem.link("All Overwatch maps", "/maps")));
        return sections;
    }

    private List<HeroStatDto> competitiveHeroes(String mapSlug) {
        try {
            return statsService.getStats(StatsFilter.of(GameQueue.COMPETITIVE, RankTier.ALL, mapSlug,
                    Platform.PC, Region.EUROPE), null, StatsSort.PICK_RATE, true).heroes();
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

    private void add(List<SeoSection> sections, String heading, List<SeoItem> items) {
        if (!items.isEmpty()) {
            sections.add(new SeoSection(heading, items));
        }
    }

    private List<SeoItem> lines(String text) {
        if (text == null) {
            return List.of();
        }
        return Arrays.stream(text.split("\\R"))
                .map(line -> readable(LIST_MARKER.matcher(line).replaceFirst("")))
                .filter(line -> !line.isEmpty())
                .map(SeoItem::plain)
                .toList();
    }

    private SeoItem perkItem(PerkDto perk) {
        String slot = perk.slot() == null ? "" : modeName(perk.slot().name()) + " perk: ";
        String recommendation = perk.recommendation() == null ? ""
                : " (" + modeName(perk.recommendation().name()) + ")";
        String description = perk.description() == null || perk.description().isBlank() ? ""
                : ": " + readable(perk.description());
        String note = perk.recommendationNote() == null || perk.recommendationNote().isBlank() ? ""
                : " " + readable(perk.recommendationNote());
        return SeoItem.plain(slot + perk.name() + recommendation + description + note);
    }

    private List<SeoItem> relatedItems(List<RelatedHeroDto> heroes) {
        return heroes.stream()
                .map(hero -> SeoItem.link(hero.name() + (hero.note() == null || hero.note().isBlank() ? ""
                        : ": " + readable(hero.note())), "/heroes/" + hero.slug()))
                .toList();
    }

    private String modeSuffix(MapMode mode) {
        return mode == null ? "" : " (" + modeName(mode.name()) + ")";
    }

    private String roleName(HeroDto hero) {
        return hero.role() == null ? "hero" : hero.role().name().toLowerCase(Locale.ROOT);
    }

    String modeLabel(MapMode mode) {
        return modeName(mode.name());
    }

    private String modeName(String constant) {
        String lower = constant.toLowerCase(Locale.ROOT).replace('_', ' ');
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }
}
