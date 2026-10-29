package gg.overlab.backend.collector;

import gg.overlab.backend.hero.perk.PerkSlot;
import java.util.ArrayList;
import java.util.List;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

@Component
public class HeroPerkParser {

    public List<ParsedPerk> parse(String html) {
        Document document = Jsoup.parse(html);
        List<ParsedPerk> perks = new ArrayList<>();
        for (Element category : document.select(".perk-category")) {
            PerkSlot slot = slotOf(category);
            if (slot == null) {
                continue;
            }
            for (Element details : category.select(".perk-details")) {
                String name = textOf(details.selectFirst("h3[slot=subheading]"));
                if (name == null) {
                    continue;
                }
                Element icon = details.selectFirst(".perk-details-icon img");
                perks.add(new ParsedPerk(slot, name, textOf(details.selectFirst("div[slot=description]")),
                        icon == null ? null : icon.attr("src")));
            }
        }
        return List.copyOf(perks);
    }

    private PerkSlot slotOf(Element category) {
        if (category.hasClass("major")) {
            return PerkSlot.MAJOR;
        }
        return category.hasClass("minor") ? PerkSlot.MINOR : null;
    }

    private String textOf(Element element) {
        if (element == null) {
            return null;
        }
        String text = element.text().trim();
        return text.isEmpty() ? null : text;
    }
}
