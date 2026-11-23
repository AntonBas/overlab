package gg.overlab.backend.seo;

import gg.overlab.backend.config.cache.CacheNames;
import gg.overlab.backend.gamemap.MapService;
import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.guide.GuideService;
import gg.overlab.backend.guide.dto.GuideDto;
import gg.overlab.backend.hero.HeroService;
import gg.overlab.backend.hero.dto.HeroDto;
import gg.overlab.backend.stats.SnapshotCheckService;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

@Service
public class SitemapService {

    private final HeroService heroService;
    private final MapService mapService;
    private final GuideService guideService;
    private final SeoContentBuilder contentBuilder;
    private final SiteUrl siteUrl;
    private final SnapshotCheckService snapshotCheckService;

    public SitemapService(HeroService heroService, MapService mapService, GuideService guideService,
                          SeoContentBuilder contentBuilder, SiteUrl siteUrl,
                          SnapshotCheckService snapshotCheckService) {
        this.contentBuilder = contentBuilder;
        this.heroService = heroService;
        this.mapService = mapService;
        this.guideService = guideService;
        this.siteUrl = siteUrl;
        this.snapshotCheckService = snapshotCheckService;
    }

    @Cacheable(value = CacheNames.CONTENT, key = "'sitemap'")
    public String build() {
        StringBuilder xml = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
                .append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        Instant statsChanged = latestStatsChange();
        boolean hasGuides = !guideService.findPublished(null, null).isEmpty();
        StaticSeoPage.navigationPages().stream()
                .filter(page -> hasGuides || !"/guides".equals(page.path()))
                .forEach(page -> appendUrl(xml, page.path(), "/".equals(page.path()) ? statsChanged : null));
        for (HeroDto hero : heroService.findAll()) {
            String heroPath = "/heroes/" + hero.slug();
            appendUrl(xml, heroPath, statsChanged);
            if (!contentBuilder.heroPerks(hero).isEmpty()) {
                appendUrl(xml, heroPath + "/perks", statsChanged);
            }
            if (!contentBuilder.heroCounters(hero).isEmpty()) {
                appendUrl(xml, heroPath + "/counters", statsChanged);
            }
            if (!contentBuilder.heroMaps(hero).isEmpty()) {
                appendUrl(xml, heroPath + "/maps", statsChanged);
            }
            appendGuideList(xml, heroPath + "/guides", guideService.findPublished(hero.slug(), null));
        }
        for (MapDto map : mapService.findAll()) {
            appendUrl(xml, "/maps/" + map.slug(), statsChanged);
            appendGuideList(xml, "/maps/" + map.slug() + "/guides", guideService.findPublished(null, map.slug()));
        }
        for (GuideDto guide : guideService.findPublished(null, null)) {
            appendUrl(xml, "/guides/" + guide.path(), guide.createdAt());
        }
        return xml.append("</urlset>\n").toString();
    }

    private void appendGuideList(StringBuilder xml, String path, List<GuideDto> guides) {
        if (guides.size() < SeoContentBuilder.MIN_GUIDES_FOR_LIST) {
            return;
        }
        guides.stream().map(GuideDto::createdAt).filter(Objects::nonNull).max(Comparator.naturalOrder())
                .ifPresentOrElse(latest -> appendUrl(xml, path, latest), () -> appendUrl(xml, path, null));
    }

    private Instant latestStatsChange() {
        return snapshotCheckService.latestChange().orElse(null);
    }

    private void appendUrl(StringBuilder xml, String path, Instant lastModified) {
        xml.append("  <url><loc>").append(HtmlUtils.htmlEscape(siteUrl.absolute(path))).append("</loc>");
        if (lastModified != null) {
            xml.append("<lastmod>").append(lastModified).append("</lastmod>");
        }
        xml.append("</url>\n");
    }
}
