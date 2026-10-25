package gg.overlab.backend.common;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Map;
import java.util.function.Predicate;
import org.springframework.stereotype.Service;

@Service
public class SlugService {

    private static final String FALLBACK_SLUG = "item";

    private static final Map<Character, String> CYRILLIC_TO_LATIN = Map.ofEntries(
            Map.entry('а', "a"), Map.entry('б', "b"), Map.entry('в', "v"), Map.entry('г', "h"),
            Map.entry('ґ', "g"), Map.entry('д', "d"), Map.entry('е', "e"), Map.entry('є', "ie"),
            Map.entry('ж', "zh"), Map.entry('з', "z"), Map.entry('и', "y"), Map.entry('і', "i"),
            Map.entry('ї', "i"), Map.entry('й', "i"), Map.entry('к', "k"), Map.entry('л', "l"),
            Map.entry('м', "m"), Map.entry('н', "n"), Map.entry('о', "o"), Map.entry('п', "p"),
            Map.entry('р', "r"), Map.entry('с', "s"), Map.entry('т', "t"), Map.entry('у', "u"),
            Map.entry('ф', "f"), Map.entry('х', "kh"), Map.entry('ц', "ts"), Map.entry('ч', "ch"),
            Map.entry('ш', "sh"), Map.entry('щ', "shch"), Map.entry('ь', ""), Map.entry('ю', "iu"),
            Map.entry('я', "ia"), Map.entry('ы', "y"), Map.entry('э', "e"), Map.entry('ё', "e"),
            Map.entry('ъ', ""), Map.entry('\'', ""), Map.entry('’', ""));

    public String generate(String text) {
        if (text == null || text.isBlank()) {
            return FALLBACK_SLUG;
        }
        String slug = Normalizer.normalize(transliterate(text), Normalizer.Form.NFD)
                .replaceAll("[^\\p{ASCII}]", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        return slug.isEmpty() ? FALLBACK_SLUG : slug;
    }

    public String generateUnique(String text, Predicate<String> isTaken) {
        String base = generate(text);
        String candidate = base;
        int counter = 1;
        while (isTaken.test(candidate)) {
            candidate = base + "-" + counter;
            counter++;
        }
        return candidate;
    }

    private String transliterate(String text) {
        StringBuilder result = new StringBuilder(text.length());
        for (char character : text.toLowerCase(Locale.ROOT).toCharArray()) {
            result.append(CYRILLIC_TO_LATIN.getOrDefault(character, String.valueOf(character)));
        }
        return result.toString();
    }
}
