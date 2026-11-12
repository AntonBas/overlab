package gg.overlab.backend.collector.parser;

import gg.overlab.backend.gamemap.MapMode;
import gg.overlab.backend.stats.dto.StatsFilter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

@Component
public class MapListParser {

    public List<ParsedMap> parse(String html) {
        Document document = Jsoup.parse(html);
        List<ParsedMap> maps = new ArrayList<>();
        for (Element group : document.select("#filter-map-select optgroup")) {
            MapMode mode = modeOf(group.attr("label"));
            for (Element option : group.select("option")) {
                String slug = option.attr("value").trim();
                String name = option.text().trim();
                if (!slug.isEmpty() && !StatsFilter.ALL_MAPS.equals(slug) && !name.isEmpty()) {
                    maps.add(new ParsedMap(slug, name, mode));
                }
            }
        }
        return List.copyOf(maps);
    }

    private MapMode modeOf(String label) {
        try {
            return MapMode.valueOf(label.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }
}
