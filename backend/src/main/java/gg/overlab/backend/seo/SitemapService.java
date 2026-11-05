package gg.overlab.backend.seo;

import gg.overlab.backend.config.cache.CacheNames;
import gg.overlab.backend.gamemap.GameMap;
import gg.overlab.backend.gamemap.GameMapRepository;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

@Service
public class SitemapService {

    private static final List<String> STATIC_PATHS = List.of("/stats", "/maps", "/perks", "/changes");

    private final HeroRepository heroRepository;
    private final GameMapRepository mapRepository;
    private final String baseUrl;

    public SitemapService(HeroRepository heroRepository, GameMapRepository mapRepository,
                          @Value("${app.frontend-url}") String frontendUrl) {
        this.heroRepository = heroRepository;
        this.mapRepository = mapRepository;
        this.baseUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    }

    @Cacheable(value = CacheNames.CONTENT, key = "'sitemap'")
    @Transactional(readOnly = true)
    public String build() {
        StringBuilder xml = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
                .append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        STATIC_PATHS.forEach(path -> appendUrl(xml, path, null));
        for (Hero hero : heroRepository.findAllByActiveTrueOrderByNameAsc()) {
            appendUrl(xml, "/heroes/" + hero.getSlug(), lastModified(hero));
        }
        for (GameMap map : mapRepository.findAllByOrderByNameAsc()) {
            appendUrl(xml, "/maps/" + map.getSlug(), lastModified(map));
        }
        return xml.append("</urlset>\n").toString();
    }

    private void appendUrl(StringBuilder xml, String path, LocalDate lastModified) {
        xml.append("  <url><loc>").append(HtmlUtils.htmlEscape(baseUrl + path)).append("</loc>");
        if (lastModified != null) {
            xml.append("<lastmod>").append(lastModified).append("</lastmod>");
        }
        xml.append("</url>\n");
    }

    private LocalDate lastModified(Hero hero) {
        return hero.getUpdatedAt() == null ? null : hero.getUpdatedAt().atZone(ZoneOffset.UTC).toLocalDate();
    }

    private LocalDate lastModified(GameMap map) {
        return map.getUpdatedAt() == null ? null : map.getUpdatedAt().atZone(ZoneOffset.UTC).toLocalDate();
    }
}
