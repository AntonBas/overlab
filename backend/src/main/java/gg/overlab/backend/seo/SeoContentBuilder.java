package gg.overlab.backend.seo;

import gg.overlab.backend.gamemap.MapMode;
import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.guide.GuideService;
import gg.overlab.backend.guide.dto.GuideDto;
import gg.overlab.backend.gamemap.MapService;
import gg.overlab.backend.hero.HeroService;
import gg.overlab.backend.hero.ability.AbilityService;
import gg.overlab.backend.hero.dto.HeroDto;
import gg.overlab.backend.hero.perk.PerkRecommendation;
import gg.overlab.backend.hero.perk.PerkService;
import gg.overlab.backend.hero.perk.PerkSlot;
import gg.overlab.backend.hero.perk.dto.PerkDto;
import gg.overlab.backend.hero.relation.HeroRelationService;
import gg.overlab.backend.hero.relation.dto.HeroCountersDto;
import gg.overlab.backend.hero.relation.dto.RelatedHeroDto;
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
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class SeoContentBuilder {

    static final int MIN_GUIDES_FOR_LIST = 2;
    private static final int LATEST_GUIDES = 10;
    private static final Pattern LINK_MARKUP = Pattern.compile("\\[\\[[^\\]/]+/([^\\]]+)]]");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private static final Pattern LIST_MARKER = Pattern.compile("^[-*•\\s]+");

    private final HeroService heroService;
    private final MapService mapService;
    private final AbilityService abilityService;
    private final PerkService perkService;
    private final HeroRelationService relationService;
    private final SeoStatsContent statsContent;
    private final GuideService guideService;

    public SeoContentBuilder(HeroService heroService, MapService mapService, AbilityService abilityService,
                             PerkService perkService, HeroRelationService relationService,
                             SeoStatsContent statsContent, GuideService guideService) {
        this.statsContent = statsContent;
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
        List<SeoSection> statistics = statsContent.overview();
        if (statistics.isEmpty()) {
            add(sections, "Hero statistics", heroService.findAll().stream()
                    .map(hero -> SeoItem.link(hero.name() + " win, pick and ban rates", "/heroes/" + hero.slug()))
                    .toList());
        } else {
            sections.addAll(statistics);
        }
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
        sections.addAll(statsContent.latestPatchChanges());
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
        statsContent.heroRates(hero).ifPresent(sections::add);
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
        List<SeoSection> relations = relationSections(hero);
        if (relations.isEmpty()) {
            return relations;
        }
        List<SeoSection> sections = new ArrayList<>();
        add(sections, hero.name() + " counters at a glance", List.of(SeoItem.plain(hero.name()
                + " counters and synergies, curated by Overlab: " + relations.stream()
                .map(section -> section.heading() + " (" + section.items().size() + ")")
                .collect(Collectors.joining("; ")) + ".")));
        sections.addAll(relations);
        add(sections, "More about " + hero.name(),
                List.of(SeoItem.link(hero.name() + " stats, perks and best maps", "/heroes/" + hero.slug())));
        return sections;
    }

    List<SeoSection> heroCounterTab(HeroDto hero, String tab) {
        List<SeoSection> sections = new ArrayList<>();
        switch (tab) {
            case "strong-against" -> add(sections, "Heroes " + hero.name() + " is strong against",
                    relatedItems(relationService.getCounters(hero.slug()).counters()));
            case "struggles-against" -> add(sections, "Heroes that counter " + hero.name(),
                    relatedItems(relationService.getCounters(hero.slug()).counteredBy()));
            default -> add(sections, "Heroes that work well with " + hero.name(),
                    relatedItems(relationService.getSynergies(hero.slug())));
        }
        if (sections.isEmpty()) {
            return sections;
        }
        add(sections, "More about " + hero.name(), List.of(
                SeoItem.link(hero.name() + " counters and synergies", "/heroes/" + hero.slug() + "/counters"),
                SeoItem.link(hero.name() + " stats, perks and best maps", "/heroes/" + hero.slug())));
        return sections;
    }

    List<SeoSection> heroMaps(HeroDto hero) {
        List<SeoSection> sections = new ArrayList<>(statsContent.heroMapRankings(hero));
        if (sections.isEmpty()) {
            return sections;
        }
        add(sections, "More about " + hero.name(),
                List.of(SeoItem.link(hero.name() + " stats, perks and counters", "/heroes/" + hero.slug())));
        return sections;
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
        List<PerkDto> perks = perkService.findByHero(hero.slug());
        if (!perks.isEmpty()) {
            add(sections, hero.name() + " perks overview", List.of(SeoItem.plain(perkSummary(hero, perks))));
        }
        add(sections, "Best " + hero.name() + " perks", perks.stream().map(this::perkItem).toList());
        if (!perks.isEmpty()) {
            add(sections, "More about " + hero.name(),
                    List.of(SeoItem.link(hero.name() + " stats, counters and best maps", "/heroes/" + hero.slug())));
        }
        return sections;
    }

    private String perkSummary(HeroDto hero, List<PerkDto> perks) {
        long minor = perks.stream().filter(perk -> perk.slot() == PerkSlot.MINOR).count();
        long major = perks.stream().filter(perk -> perk.slot() == PerkSlot.MAJOR).count();
        List<String> recommended = perks.stream()
                .filter(perk -> perk.recommendation() == PerkRecommendation.RECOMMENDED).map(PerkDto::name).toList();
        return hero.name() + " has " + perks.size() + " perks: " + minor + " Minor and " + major + " Major."
                + (recommended.isEmpty() ? "" : " Recommended: " + String.join(", ", recommended) + ".");
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
        List<SeoSection> rankings = statsContent.mapRankings(map);
        if (rankings.isEmpty()) {
            return sections;
        }
        sections.addAll(rankings);
        add(sections, "More statistics", List.of(SeoItem.link("Hero statistics on all maps", "/"),
                SeoItem.link("All Overwatch maps", "/maps")));
        return sections;
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

    static String modeSuffix(MapMode mode) {
        return mode == null ? "" : " (" + modeName(mode.name()) + ")";
    }

    private String roleName(HeroDto hero) {
        return hero.role() == null ? "hero" : hero.role().name().toLowerCase(Locale.ROOT);
    }

    String modeLabel(MapMode mode) {
        return modeName(mode.name());
    }

    static String modeName(String constant) {
        String lower = constant.toLowerCase(Locale.ROOT).replace('_', ' ');
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }
}
