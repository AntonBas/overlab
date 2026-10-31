package gg.overlab.backend.collector;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.TextNode;
import org.springframework.stereotype.Component;

@Component
public class HeroAbilityParser {

    private static final String SECTION_TITLE = "Abilities";
    private static final Pattern KEY_ICON = Pattern.compile("([a-z-]+)$");

    public List<ParsedAbility> parse(String html) {
        Document document = Jsoup.parse(html);
        Element section = document.select("blz-carousel-section").stream()
                .filter(candidate -> SECTION_TITLE.equalsIgnoreCase(textOf(candidate.selectFirst("h2[slot=heading]"))))
                .findFirst()
                .orElse(null);
        if (section == null) {
            return List.of();
        }
        Map<String, String> descriptions = descriptionsByName(section);
        List<ParsedAbility> abilities = new ArrayList<>();
        for (Element control : section.select("blz-tab-control[id]")) {
            String name = control.attr("label").trim();
            if (name.isEmpty()) {
                continue;
            }
            Element icon = control.selectFirst("blz-image[slot=icon]");
            abilities.add(new ParsedAbility(control.id(), name, descriptions.get(name),
                    icon == null || icon.attr("src").isBlank() ? null : icon.attr("src"), abilities.size()));
        }
        return List.copyOf(abilities);
    }

    private Map<String, String> descriptionsByName(Element section) {
        Map<String, String> descriptions = new HashMap<>();
        for (Element slide : section.select("blz-feature")) {
            String name = textOf(slide.selectFirst("h3[slot=heading]"));
            Element description = slide.selectFirst("p[slot=description]");
            if (name != null && description != null) {
                descriptions.put(name, readableText(description));
            }
        }
        return descriptions;
    }

    private String readableText(Element description) {
        Element copy = description.clone();
        for (Element image : copy.select("img")) {
            Matcher matcher = KEY_ICON.matcher(image.attr("alt"));
            String key = matcher.find() ? matcher.group(1).replace('-', ' ') : "";
            image.replaceWith(new TextNode(key));
        }
        String text = copy.text().replaceAll("\\s+", " ").trim();
        return text.isEmpty() ? null : text;
    }

    private String textOf(Element element) {
        if (element == null) {
            return null;
        }
        String text = element.text().trim();
        return text.isEmpty() ? null : text;
    }
}
