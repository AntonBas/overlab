package gg.overlab.backend.seo;

import gg.overlab.backend.gamemap.MapMode;
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
import gg.overlab.backend.stats.dto.HeroMapStatDto;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class SeoContentBuilder {

    private static final Pattern LINK_MARKUP = Pattern.compile("\\[\\[[^\\]/]+/([^\\]]+)]]");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private static final Pattern LIST_MARKER = Pattern.compile("^[-*•\\s]+");

    private final HeroService heroService;
    private final MapService mapService;
    private final AbilityService abilityService;
    private final PerkService perkService;
    private final HeroRelationService relationService;
    private final StatsService statsService;

    public SeoContentBuilder(HeroService heroService, MapService mapService, AbilityService abilityService,
                             PerkService perkService, HeroRelationService relationService,
                             StatsService statsService) {
        this.statsService = statsService;
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

    List<SeoSection> mapList() {
        List<SeoItem> items = mapService.findAll().stream()
                .map(map -> SeoItem.link(map.name() + modeSuffix(map.mode()), "/maps/" + map.slug()))
                .toList();
        return List.of(new SeoSection("Maps", items));
    }

    List<SeoSection> heroDetails(HeroDto hero) {
        List<SeoSection> sections = new ArrayList<>();
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

    List<SeoSection> mapDetails(String modeLabel) {
        return modeLabel == null ? List.of()
                : List.of(new SeoSection("Game mode", List.of(SeoItem.plain(modeLabel))));
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

    private String modeName(String constant) {
        String lower = constant.toLowerCase(Locale.ROOT).replace('_', ' ');
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }
}
