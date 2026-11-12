package gg.overlab.backend.seo;

import gg.overlab.backend.config.cache.CacheNames;
import gg.overlab.backend.gamemap.MapService;
import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.guide.GuideService;
import gg.overlab.backend.guide.dto.GuideDto;
import gg.overlab.backend.hero.HeroService;
import gg.overlab.backend.hero.dto.HeroDto;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

@Service
public class SitemapService {

    private final HeroService heroService;
    private final MapService mapService;
    private final GuideService guideService;
    private final SiteUrl siteUrl;

    public SitemapService(HeroService heroService, MapService mapService, GuideService guideService,
                          SiteUrl siteUrl) {
        this.heroService = heroService;
        this.mapService = mapService;
        this.guideService = guideService;
        this.siteUrl = siteUrl;
    }

    @Cacheable(value = CacheNames.CONTENT, key = "'sitemap'")
    public String build() {
        StringBuilder xml = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
                .append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        StaticSeoPage.navigationPages().forEach(page -> appendUrl(xml, page.path()));
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
        xml.append("  <url><loc>").append(HtmlUtils.htmlEscape(siteUrl.absolute(path))).append("</loc></url>\n");
    }
}
