package gg.overlab.backend.seo;

import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.gamemap.MapService;
import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.guide.GuideService;
import gg.overlab.backend.guide.dto.GuideDto;
import gg.overlab.backend.hero.HeroService;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

@Service
public class SeoPageResolver {

    static final String SITE_NAME = StaticSeoPage.SITE_NAME;

    private static final int MAX_DESCRIPTION_LENGTH = 160;
    private static final Pattern PAGE_PATH =
            Pattern.compile("^/(heroes|maps|guides)/([A-Za-z0-9-]+)(?:/(perks|counters|maps))?$");

    private final HeroService heroService;
    private final MapService mapService;
    private final GuideService guideService;
    private final SiteUrl siteUrl;
    private final SeoContentBuilder contentBuilder;

    public SeoPageResolver(HeroService heroService, MapService mapService, GuideService guideService,
                           SiteUrl siteUrl, SeoContentBuilder contentBuilder) {
        this.heroService = heroService;
        this.mapService = mapService;
        this.guideService = guideService;
        this.siteUrl = siteUrl;
        this.contentBuilder = contentBuilder;
    }

    public static String cacheKey(String requestedPath) {
        return normalize(requestedPath);
    }

    public Optional<SeoPage> resolve(String requestedPath) {
        String path = normalize(requestedPath);
        Optional<StaticSeoPage> fixed = StaticSeoPage.find(path);
        if (fixed.isPresent()) {
            return fixed.map(this::staticPage);
        }
        Matcher matcher = PAGE_PATH.matcher(path);
        if (!matcher.matches()) {
            return Optional.empty();
        }
        String section = matcher.group(1);
        String key = matcher.group(2);
        if (matcher.group(3) != null) {
            return "heroes".equals(section) ? heroSubPage(key, matcher.group(3)) : Optional.empty();
        }
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

    private SeoPage staticPage(StaticSeoPage page) {
        List<String> data = "/".equals(page.path()) ? List.of(websiteData())
                : List.of(breadcrumbs(page.path(), page.heading()));
        return new SeoPage(page.path(), page.title(), page.description(), "website", page.heading(), data,
                staticSections(page.path()));
    }

    private List<SeoSection> staticSections(String path) {
        return switch (path) {
            case "/maps" -> contentBuilder.mapList();
            case "/privacy", "/terms", "/cookies", "/business" -> List.of();
            default -> contentBuilder.heroList();
        };
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
                    List.of(breadcrumbs(path, hero.name(), "/heroes", "Heroes")), contentBuilder.heroDetails(hero));
        });
    }

    private Optional<SeoPage> heroSubPage(String slug, String kind) {
        return heroService.findAll().stream().filter(hero -> hero.slug().equals(slug)).findFirst().flatMap(hero -> {
            List<SeoSection> sections = switch (kind) {
                case "perks" -> contentBuilder.heroPerks(hero);
                case "counters" -> contentBuilder.heroCounters(hero);
                default -> contentBuilder.heroMaps(hero);
            };
            if (sections.isEmpty()) {
                return Optional.<SeoPage>empty();
            }
            String path = "/heroes/" + hero.slug() + "/" + kind;
            String name = hero.name();
            String title = switch (kind) {
                case "perks" -> name + " perks: best Minor and Major perks";
                case "counters" -> name + " counters and synergies";
                default -> "Best and worst maps for " + name;
            };
            String description = switch (kind) {
                case "perks" -> "Best Overwatch " + name + " perks: every Minor and Major perk with a description,"
                        + " a rating and why it is worth taking.";
                case "counters" -> "Overwatch " + name + " counters: the heroes " + name + " is strong against,"
                        + " the heroes that counter " + name + " and who works well with " + name + ".";
                default -> "Best and worst Overwatch maps for " + name + ": win and pick rate on every map"
                        + " compared with " + name + "'s average.";
            };
            String heading = switch (kind) {
                case "perks" -> name + " perks";
                case "counters" -> name + " counters and synergies";
                default -> name + " maps";
            };
            String crumb = switch (kind) {
                case "perks" -> "Perks";
                case "counters" -> "Counters";
                default -> "Maps";
            };
            return Optional.of(new SeoPage(path, title, plain(description), "website", heading,
                    List.of(breadcrumbList(List.of(new String[] {SITE_NAME, "/"},
                            new String[] {"Heroes", "/heroes"},
                            new String[] {name, "/heroes/" + hero.slug()},
                            new String[] {crumb, path}))),
                    sections));
        });
    }

    private Optional<SeoPage> mapPage(String slug) {
        try {
            MapDto map = mapService.getBySlug(slug);
            String path = "/maps/" + map.slug();
            String description = map.name() + ": win, pick and ban rates of every Overwatch hero on this map.";
            return Optional.of(new SeoPage(path, map.name(), description, "website", map.name(),
                    List.of(breadcrumbs(path, map.name(), "/maps", "Maps")),
                    contentBuilder.mapDetails(map.mode() == null ? null : map.mode().name())));
        } catch (EntityNotFoundException exception) {
            return Optional.empty();
        }
    }

    private Optional<SeoPage> guidePage(String key) {
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
                        videoData(guide, path, description)),
                guide.description() == null || guide.description().isBlank() ? List.of()
                        : List.of(new SeoSection("About this guide",
                                List.of(SeoItem.plain(SeoContentBuilder.readable(guide.description()))))));
    }

    String plain(String text) {
        String readable = SeoContentBuilder.readable(text);
        return readable.length() > MAX_DESCRIPTION_LENGTH
                ? readable.substring(0, MAX_DESCRIPTION_LENGTH - 1).stripTrailing() + "…" : readable;
    }

    private String websiteData() {
        return "{\"@context\":\"https://schema.org\",\"@type\":\"WebSite\",\"name\":" + JsonText.quote(SITE_NAME)
                + ",\"url\":" + JsonText.quote(siteUrl.absolute("/")) + "}";
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
                    .append(",\"item\":").append(JsonText.quote(siteUrl.absolute(trail.get(index)[1]))).append('}');
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
                .append(",\"url\":").append(JsonText.quote(siteUrl.absolute(path)));
        if (guide.createdAt() != null) {
            json.append(",\"uploadDate\":").append(JsonText.quote(guide.createdAt().toString()));
        }
        return json.append('}').toString();
    }
}
