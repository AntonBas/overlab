package gg.overlab.backend.seo;

import gg.overlab.backend.gamemap.GameMapRepository;
import gg.overlab.backend.guide.Guide;
import gg.overlab.backend.guide.GuideRepository;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SeoPageResolver {

    static final String SITE_NAME = "Overlab";
    static final String HOME_DESCRIPTION = "Overwatch 2 hero statistics by map and rank: win, pick and ban rates, "
            + "perks, counters and video guides. Unofficial fan site.";

    private static final int MAX_DESCRIPTION_LENGTH = 160;
    private static final Pattern PAGE_PATH = Pattern.compile("^/(heroes|maps|guides)/([A-Za-z0-9-]+)$");
    private static final Pattern GUIDE_PATH = Pattern.compile("^(\\d+)(?:-.*)?$");
    private static final Pattern LINK_MARKUP = Pattern.compile("\\[\\[[^\\]/]+/([^\\]]+)]]");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");

    private static final Map<String, String[]> STATIC_PAGES = Map.ofEntries(
            Map.entry("/", new String[] {SITE_NAME, HOME_DESCRIPTION}),
            Map.entry("/stats", new String[] {"Hero statistics", "Overwatch 2 hero win, pick and ban rates by rank, "
                    + "map, region and platform, updated from Blizzard public data."}),
            Map.entry("/heroes", new String[] {"Heroes",
                    "All Overwatch 2 heroes with roles, abilities, perks, counters and synergies."}),
            Map.entry("/counters", new String[] {"Counters", "Curated Overwatch 2 counter picks and synergies "
                    + "for every hero, with short explanations."}),
            Map.entry("/perks", new String[] {"Perks",
                    "Every Overwatch 2 hero perk in one place, with Minor and Major slots and descriptions."}),
            Map.entry("/changes", new String[] {"What changed", "See which Overwatch 2 heroes gained or lost "
                    + "win and pick rate between patches and over the last weeks."}),
            Map.entry("/maps", new String[] {"Maps",
                    "Overwatch 2 maps by game mode, with hero win, pick and ban rates on each map."}),
            Map.entry("/privacy", new String[] {"Privacy policy", "How Overlab handles your data."}),
            Map.entry("/terms", new String[] {"Terms of use", "The rules for using Overlab."}),
            Map.entry("/cookies", new String[] {"Cookie policy", "Which cookies and local storage Overlab uses."}),
            Map.entry("/business", new String[] {"Sponsorship and business",
                    "Contact Overlab about sponsorship and partnerships."}));

    private final HeroRepository heroRepository;
    private final GameMapRepository mapRepository;
    private final GuideRepository guideRepository;
    private final String baseUrl;

    public SeoPageResolver(HeroRepository heroRepository, GameMapRepository mapRepository,
                           GuideRepository guideRepository, @Value("${app.frontend-url}") String frontendUrl) {
        this.heroRepository = heroRepository;
        this.mapRepository = mapRepository;
        this.guideRepository = guideRepository;
        this.baseUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    }

    @Transactional(readOnly = true)
    public Optional<SeoPage> resolve(String requestedPath) {
        String path = normalize(requestedPath);
        String[] fixed = STATIC_PAGES.get(path);
        if (fixed != null) {
            return Optional.of(staticPage(path, fixed[0], fixed[1]));
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

    private String normalize(String path) {
        if (path == null || path.isBlank()) {
            return "/";
        }
        String trimmed = path.length() > 1 && path.endsWith("/") ? path.substring(0, path.length() - 1) : path;
        return trimmed.startsWith("/") ? trimmed : "/" + trimmed;
    }

    private SeoPage staticPage(String path, String title, String description) {
        List<String> data = "/".equals(path) ? List.of(websiteData()) : List.of(breadcrumbs(path, title));
        return new SeoPage(path, title, description, "website", title, data);
    }

    private Optional<SeoPage> heroPage(String slug) {
        return heroRepository.findBySlug(slug).filter(Hero::isActive).map(hero -> {
            String path = "/heroes/" + hero.getSlug();
            String detail = hero.getDescription() == null || hero.getDescription().isBlank()
                    ? "Overwatch 2 hero statistics, perks and counters." : hero.getDescription();
            String description = plain(hero.getName() + ": " + detail);
            return new SeoPage(path, hero.getName(), description, "website", hero.getName(),
                    List.of(breadcrumbs(path, hero.getName(), "/heroes", "Heroes")));
        });
    }

    private Optional<SeoPage> mapPage(String slug) {
        return mapRepository.findBySlug(slug).map(map -> {
            String path = "/maps/" + map.getSlug();
            String description = map.getName() + ": win, pick and ban rates of every Overwatch 2 hero on this map.";
            return new SeoPage(path, map.getName(), description, "website", map.getName(),
                    List.of(breadcrumbs(path, map.getName(), "/maps", "Maps")));
        });
    }

    private Optional<SeoPage> guidePage(String key) {
        Matcher matcher = GUIDE_PATH.matcher(key);
        if (!matcher.matches()) {
            return Optional.empty();
        }
        return guideRepository.findWithDetailsById(Long.valueOf(matcher.group(1)))
                .filter(Guide::isPublished)
                .map(this::toGuidePage);
    }

    private SeoPage toGuidePage(Guide guide) {
        String path = "/guides/" + guide.getId() + "-" + guide.getSlug();
        String mapPart = guide.getMap() == null ? "" : " for " + guide.getMap().getName();
        String description = plain(guide.getTitle() + ": a short " + guide.getHero().getName()
                + " video guide" + mapPart + ".");
        return new SeoPage(path, guide.getTitle(), description, "video.other", guide.getTitle(),
                List.of(breadcrumbs(path, guide.getTitle(), "/heroes/" + guide.getHero().getSlug(),
                        guide.getHero().getName()), videoData(guide, path, description)));
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

    private String videoData(Guide guide, String path, String description) {
        StringBuilder json = new StringBuilder("{\"@context\":\"https://schema.org\",\"@type\":\"VideoObject\"")
                .append(",\"name\":").append(JsonText.quote(guide.getTitle()))
                .append(",\"description\":").append(JsonText.quote(description))
                .append(",\"thumbnailUrl\":").append(JsonText.quote(
                        "https://i.ytimg.com/vi/" + guide.getYoutubeId() + "/hqdefault.jpg"))
                .append(",\"embedUrl\":").append(JsonText.quote(
                        "https://www.youtube-nocookie.com/embed/" + guide.getYoutubeId()))
                .append(",\"url\":").append(JsonText.quote(baseUrl + path));
        if (guide.getCreatedAt() != null) {
            json.append(",\"uploadDate\":").append(JsonText.quote(guide.getCreatedAt().toString()));
        }
        return json.append('}').toString();
    }
}
