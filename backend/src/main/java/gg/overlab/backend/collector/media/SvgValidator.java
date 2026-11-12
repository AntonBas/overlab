package gg.overlab.backend.collector.media;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Attribute;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.parser.Parser;

final class SvgValidator {

    private static final Set<String> ALLOWED_ELEMENTS = Set.of(
            "svg", "g", "path", "circle", "ellipse", "rect", "line", "polyline", "polygon", "defs", "clippath",
            "mask", "lineargradient", "radialgradient", "stop", "title", "desc", "style");
    private static final Set<String> REFERENCE_ATTRIBUTES = Set.of("href", "xlink:href");
    private static final Pattern UNSAFE_STYLE = Pattern.compile(
            "@import|javascript:|expression\\(|behavior:|url\\(\\s*['\"]?(?!#)", Pattern.CASE_INSENSITIVE);

    private SvgValidator() {
    }

    static boolean isSafe(String content) {
        String lowerCase = content.toLowerCase(Locale.ROOT);
        if (lowerCase.contains("<!doctype") || lowerCase.contains("<!entity") || lowerCase.contains("<![cdata[")) {
            return false;
        }
        Document document = Jsoup.parse(content, "", Parser.xmlParser());
        Element root = document.children().first();
        if (root == null || !"svg".equals(root.tagName().toLowerCase(Locale.ROOT))) {
            return false;
        }
        return document.getAllElements().stream()
                .filter(element -> element != document)
                .allMatch(SvgValidator::isSafeElement);
    }

    private static boolean isSafeElement(Element element) {
        String name = element.tagName().toLowerCase(Locale.ROOT);
        if (!ALLOWED_ELEMENTS.contains(name)) {
            return false;
        }
        if ("style".equals(name) && UNSAFE_STYLE.matcher(element.data() + element.text()).find()) {
            return false;
        }
        return element.attributes().asList().stream().allMatch(SvgValidator::isSafeAttribute);
    }

    private static boolean isSafeAttribute(Attribute attribute) {
        String name = attribute.getKey().toLowerCase(Locale.ROOT);
        String value = attribute.getValue().strip();
        if (name.startsWith("on")) {
            return false;
        }
        if (REFERENCE_ATTRIBUTES.contains(name)) {
            return value.startsWith("#");
        }
        if ("style".equals(name) && UNSAFE_STYLE.matcher(value).find()) {
            return false;
        }
        return !value.toLowerCase(Locale.ROOT).contains("javascript:");
    }
}
