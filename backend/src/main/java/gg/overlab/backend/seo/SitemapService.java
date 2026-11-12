package gg.overlab.backend.seo;

import gg.overlab.backend.config.cache.CacheNames;
import gg.overlab.backend.gamemap.MapService;
import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.guide.GuideService;
import gg.overlab.backend.guide.dto.GuideDto;
import gg.overlab.backend.hero.HeroService;
import gg.overlab.backend.hero.dto.HeroDto;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

@Service
public class SitemapService {

    private static final List<String> STATIC_PATHS = List.of("/stats", "/heroes", "/counters", "/perks", "/maps",
            "/changes");

    private final HeroService heroService;
    private final MapService mapService;
    private final GuideService guideService;
    private final String baseUrl;

    public SitemapService(HeroService heroService, MapService mapService, GuideService guideService,
                          @Value("${app.frontend-url}") String frontendUrl) {
        this.heroService = heroService;
        this.mapService = mapService;
        this.guideService = guideService;
        this.baseUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    }

    @Cacheable(value = CacheNames.CONTENT, key = "'sitemap'")
    public String build() {
        StringBuilder xml = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
                .append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        STATIC_PATHS.forEach(path -> appendUrl(xml, path));
        for (HeroDto hero : heroService.findAll()) {
            appendUrl(xml, "/heroes/" + hero.slug());
        }
        for (MapDto map : mapService.findAll()) {
            appendUrl(xml, "/maps/" + map.slug());
        }
        for (GuideDto guide : guideService.findPublished(null, null)) {
            appendUrl(xml, "/guides/" + guide.path());
        }
        return xml.append("</urlset>\n").toString();
    }

    private void appendUrl(StringBuilder xml, String path) {
        xml.append("  <url><loc>").append(HtmlUtils.htmlEscape(baseUrl + path)).append("</loc></url>\n");
    }
}
