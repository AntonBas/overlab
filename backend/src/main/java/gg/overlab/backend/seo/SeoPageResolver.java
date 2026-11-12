package gg.overlab.backend.seo;

import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.gamemap.MapService;
import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.guide.GuidePath;
import gg.overlab.backend.guide.GuideService;
import gg.overlab.backend.guide.dto.GuideDto;
import gg.overlab.backend.hero.HeroService;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class SeoPageResolver {

    static final String SITE_NAME = "Overlab";
    static final String HOME_DESCRIPTION = "Overwatch hero statistics by map and rank: win, pick and ban rates, "
            + "perks, counters and video guides. Unofficial fan site.";

    private static final int MAX_DESCRIPTION_LENGTH = 160;
    private static final Pattern PAGE_PATH = Pattern.compile("^/(heroes|maps|guides)/([A-Za-z0-9-]+)$");
    private static final Pattern LINK_MARKUP = Pattern.compile("\\[\\[[^\\]/]+/([^\\]]+)]]");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");

    private static final Map<String, String[]> STATIC_PAGES = Map.ofEntries(
            Map.entry("/", new String[] {SITE_NAME, HOME_DESCRIPTION, SITE_NAME}),
            Map.entry("/stats", new String[] {"Overwatch hero win, pick and ban rates",
                    "Overwatch hero win, pick and ban rates by rank, map, region and platform, "
                            + "updated from Blizzard public data.", "Hero statistics"}),
            Map.entry("/heroes", new String[] {"All Overwatch heroes: roles, abilities, perks",
                    "All Overwatch heroes with roles, abilities, perks, counters and synergies.", "Heroes"}),
            Map.entry("/counters", new String[] {"Overwatch counters and synergies for every hero",
                    "Curated Overwatch counter picks and synergies for every hero, with short explanations.",
                    "Counters"}),
            Map.entry("/perks", new String[] {"Overwatch hero perks: every Minor and Major perk",
                    "Every Overwatch hero perk in one place, with Minor and Major slots and descriptions.",
                    "Perks"}),
            Map.entry("/changes", new String[] {"Overwatch hero win rate changes by patch",
                    "See which Overwatch heroes gained or lost win and pick rate between patches "
                            + "and over the last weeks.", "What changed"}),
            Map.entry("/maps", new String[] {"Overwatch maps: hero win rates by map",
                    "Overwatch maps by game mode, with hero win, pick and ban rates on each map.", "Maps"}),
            Map.entry("/privacy", new String[] {"Privacy policy", "How Overlab handles your data.",
                    "Privacy policy"}),
            Map.entry("/terms", new String[] {"Terms of use", "The rules for using Overlab.", "Terms of use"}),
            Map.entry("/cookies", new String[] {"Cookie policy", "Which cookies and local storage Overlab uses.",
                    "Cookie policy"}),
            Map.entry("/business", new String[] {"Sponsorship and business",
                    "Contact Overlab about sponsorship and partnerships.", "Sponsorship and business"}));

    private final HeroService heroService;
    private final MapService mapService;
    private final GuideService guideService;
    private final String baseUrl;

    public SeoPageResolver(HeroService heroService, MapService mapService, GuideService guideService,
                           @Value("${app.frontend-url}") String frontendUrl) {
        this.heroService = heroService;
        this.mapService = mapService;
        this.guideService = guideService;
        this.baseUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    }

    public static String cacheKey(String requestedPath) {
        String path = normalize(requestedPath);
        Matcher matcher = PAGE_PATH.matcher(path);
        if (matcher.matches() && "guides".equals(matcher.group(1))) {
            return GuidePath.parseId(matcher.group(2)).map(id -> "/guides/" + id).orElse(path);
        }
        return path;
    }

    public Optional<SeoPage> resolve(String requestedPath) {
        String path = normalize(requestedPath);
        String[] fixed = STATIC_PAGES.get(path);
        if (fixed != null) {
            return Optional.of(staticPage(path, fixed[0], fixed[1], fixed[2]));
        }
        Matcher matcher = PAGE_PATH.matcher(path);
        if (!matcher.matches()) {
            return Optional.empty();
        }
        String section = matcher.group(1);
        String key = matcher.group(2);
        return switch (section) {
            case "heroes" -> heroPage(key);
            case "maps" -> mapPage(key);
            default -> guidePage(key);
        };
    }

    static String normalize(String path) {
        if (path == null || path.isBlank()) {
            return "/";
        }
        String trimmed = path.length() > 1 && path.endsWith("/") ? path.substring(0, path.length() - 1) : path;
        return trimmed.startsWith("/") ? trimmed : "/" + trimmed;
    }

    private SeoPage staticPage(String path, String title, String description, String heading) {
        List<String> data = "/".equals(path) ? List.of(websiteData()) : List.of(breadcrumbs(path, heading));
        return new SeoPage(path, title, description, "website", heading, data);
    }

    private Optional<SeoPage> heroPage(String slug) {
        return heroService.findAll().stream().filter(hero -> hero.slug().equals(slug)).findFirst().map(hero -> {
            String path = "/heroes/" + hero.slug();
            String lead = hero.name() + " Overwatch stats: win, pick and ban rates, perks, counters"
                    + " and best maps.";
            String detail = hero.description() == null || hero.description().isBlank()
                    ? lead : lead + " " + hero.description();
            return new SeoPage(path, hero.name() + " stats, perks, counters and best maps", plain(detail),
                    "website", hero.name(),
                    List.of(breadcrumbs(path, hero.name(), "/heroes", "Heroes")));
        });
    }

    private Optional<SeoPage> mapPage(String slug) {
        try {
            MapDto map = mapService.getBySlug(slug);
            String path = "/maps/" + map.slug();
            String description = map.name() + ": win, pick and ban rates of every Overwatch hero on this map.";
            return Optional.of(new SeoPage(path, map.name(), description, "website", map.name(),
                    List.of(breadcrumbs(path, map.name(), "/maps", "Maps"))));
        } catch (EntityNotFoundException exception) {
            return Optional.empty();
        }
    }

    private Optional<SeoPage> guidePage(String key) {
        if (GuidePath.parseId(key).isEmpty()) {
            return Optional.empty();
        }
        try {
            return Optional.of(toGuidePage(guideService.getPublishedByPath(key)));
        } catch (EntityNotFoundException exception) {
            return Optional.empty();
        }
    }

    private SeoPage toGuidePage(GuideDto guide) {
        String path = "/guides/" + guide.path();
        String mapPart = guide.mapName() == null ? "" : " for " + guide.mapName();
        String description = plain(guide.title() + ": a short " + guide.heroName() + " video guide" + mapPart + ".");
        return new SeoPage(path, guide.title(), description, "video.other", guide.title(),
                List.of(breadcrumbs(path, guide.title(), "/heroes/" + guide.heroSlug(), guide.heroName()),
                        videoData(guide, path, description)));
    }

    String plain(String text) {
        String readable = WHITESPACE.matcher(LINK_MARKUP.matcher(text == null ? "" : text)
                .replaceAll(match -> Matcher.quoteReplacement(match.group(1).replace('-', ' ')))).replaceAll(" ").trim();
        return readable.length() > MAX_DESCRIPTION_LENGTH
                ? readable.substring(0, MAX_DESCRIPTION_LENGTH - 1).stripTrailing() + "…" : readable;
    }

    private String websiteData() {
        return "{\"@context\":\"https://schema.org\",\"@type\":\"WebSite\",\"name\":" + JsonText.quote(SITE_NAME)
                + ",\"url\":" + JsonText.quote(baseUrl + "/") + "}";
    }

    private String breadcrumbs(String path, String title) {
        return breadcrumbList(List.of(new String[] {SITE_NAME, "/"}, new String[] {title, path}));
    }

    private String breadcrumbs(String path, String title, String parentPath, String parentTitle) {
        return breadcrumbList(List.of(new String[] {SITE_NAME, "/"}, new String[] {parentTitle, parentPath},
                new String[] {title, path}));
    }

    private String breadcrumbList(List<String[]> trail) {
        StringBuilder items = new StringBuilder();
        for (int index = 0; index < trail.size(); index++) {
            if (index > 0) {
                items.append(',');
            }
            items.append("{\"@type\":\"ListItem\",\"position\":").append(index + 1)
                    .append(",\"name\":").append(JsonText.quote(trail.get(index)[0]))
                    .append(",\"item\":").append(JsonText.quote(baseUrl + trail.get(index)[1])).append('}');
        }
        return "{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":["
                + items + "]}";
    }

    private String videoData(GuideDto guide, String path, String description) {
        StringBuilder json = new StringBuilder("{\"@context\":\"https://schema.org\",\"@type\":\"VideoObject\"")
                .append(",\"name\":").append(JsonText.quote(guide.title()))
                .append(",\"description\":").append(JsonText.quote(description))
                .append(",\"thumbnailUrl\":").append(JsonText.quote(
                        "https://i.ytimg.com/vi/" + guide.youtubeId() + "/hqdefault.jpg"))
                .append(",\"embedUrl\":").append(JsonText.quote(
                        "https://www.youtube-nocookie.com/embed/" + guide.youtubeId()))
                .append(",\"url\":").append(JsonText.quote(baseUrl + path));
        if (guide.createdAt() != null) {
            json.append(",\"uploadDate\":").append(JsonText.quote(guide.createdAt().toString()));
        }
        return json.append('}').toString();
    }
}
