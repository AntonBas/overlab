package gg.overlab.backend.collector.imports;

import gg.overlab.backend.collector.parser.ParsedAbility;
import gg.overlab.backend.hero.ability.AbilityControl;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.IntStream;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
public class SupplementalAbilities {

    private static final String RESOURCE = "collector/supplemental-abilities.json";

    private final List<Entry> entries = load();

    public List<ParsedAbility> complete(String heroSlug, List<ParsedAbility> parsedAbilities) {
        if (parsedAbilities.isEmpty()) {
            return parsedAbilities;
        }
        List<ParsedAbility> abilities = new ArrayList<>(parsedAbilities);
        entries.stream()
                .filter(entry -> entry.heroSlug().equals(heroSlug))
                .filter(entry -> parsedAbilities.stream().noneMatch(entry::isSameAbility))
                .forEach(entry -> abilities.add(positionAfter(abilities, entry.after()), entry.toParsedAbility()));
        return IntStream.range(0, abilities.size())
                .mapToObj(index -> abilities.get(index).withSortOrder(index))
                .toList();
    }

    private int positionAfter(List<ParsedAbility> abilities, String anchorSlug) {
        if (anchorSlug == null) {
            return 0;
        }
        return IntStream.range(0, abilities.size())
                .filter(index -> abilities.get(index).slug().equals(anchorSlug))
                .map(index -> index + 1)
                .findFirst()
                .orElse(abilities.size());
    }

    private static List<Entry> load() {
        try (InputStream stream = new ClassPathResource(RESOURCE).getInputStream()) {
            String json = new String(stream.readAllBytes(), StandardCharsets.UTF_8);
            return JsonParserFactory.getJsonParser().parseList(json).stream()
                    .map(entry -> toEntry((Map<?, ?>) entry))
                    .toList();
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        }
    }

    private static Entry toEntry(Map<?, ?> values) {
        return new Entry((String) values.get("hero"), (String) values.get("slug"), (String) values.get("name"),
                (String) values.get("description"), AbilityControl.valueOf((String) values.get("control")),
                (String) values.get("after"));
    }

    private record Entry(String heroSlug, String slug, String name, String description, AbilityControl control,
                         String after) {

        private boolean isSameAbility(ParsedAbility ability) {
            return ability.slug().equals(slug) || baseName(ability.name()).equals(baseName(name));
        }

        private ParsedAbility toParsedAbility() {
            return new ParsedAbility(slug, name, description, null, 0, control, true);
        }

        private static String baseName(String name) {
            return name.replaceAll("\\s*\\([^)]*\\)", "").trim().toLowerCase(Locale.ROOT);
        }
    }
}
