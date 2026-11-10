package gg.overlab.backend.seo;

import java.util.Arrays;
import java.util.Optional;
import java.util.function.UnaryOperator;

enum HeroSection {
    PERKS("perks", "Perks",
            name -> name + " perks",
            name -> name + " perks: recommended Minor and Major perks",
            name -> "All " + name + " perks in Overwatch 2: Minor and Major perks, which ones are recommended"
                    + " and what each one does."),
    COUNTERS("counters", "Counters",
            name -> name + " counters and synergies",
            name -> name + " counters and synergies",
            name -> "Who counters " + name + " in Overwatch 2, who " + name + " counters and which heroes work well"
                    + " with " + name + ". Curated recommendations."),
    MAPS("maps", "Maps",
            name -> "Best maps for " + name,
            name -> "Best maps for " + name + ": win rate by map",
            name -> name + " win rate and pick rate on every Overwatch 2 map, with the best and worst maps.");

    private final String path;
    private final String label;
    private final UnaryOperator<String> heading;
    private final UnaryOperator<String> title;
    private final UnaryOperator<String> description;

    HeroSection(String path, String label, UnaryOperator<String> heading, UnaryOperator<String> title,
                UnaryOperator<String> description) {
        this.path = path;
        this.label = label;
        this.heading = heading;
        this.title = title;
        this.description = description;
    }

    static Optional<HeroSection> fromPath(String path) {
        return Arrays.stream(values()).filter(section -> section.path.equals(path)).findFirst();
    }

    String path() {
        return path;
    }

    String label() {
        return label;
    }

    String heading(String heroName) {
        return heading.apply(heroName);
    }

    String title(String heroName) {
        return title.apply(heroName);
    }

    String description(String heroName) {
        return description.apply(heroName);
    }
}
