package gg.overlab.backend.seo;

import java.util.List;
import java.util.Optional;

record StaticSeoPage(String path, String title, String description, String heading, boolean navigation) {

    static final String SITE_NAME = "Overlab";
    static final String HOME_DESCRIPTION = "Overwatch hero statistics by map and rank: win, pick and ban rates, "
            + "perks, counters and video guides. Unofficial fan site.";

    private static final List<StaticSeoPage> ALL = List.of(
            new StaticSeoPage("/", SITE_NAME, HOME_DESCRIPTION, SITE_NAME, false),
            new StaticSeoPage("/stats", "Overwatch hero win, pick and ban rates",
                    "Overwatch hero win, pick and ban rates by rank, map, region and platform, "
                            + "updated from Blizzard public data.", "Hero statistics", true),
            new StaticSeoPage("/heroes", "All Overwatch heroes: roles, abilities, perks",
                    "All Overwatch heroes with roles, abilities, perks, counters and synergies.", "Heroes", true),
            new StaticSeoPage("/counters", "Overwatch counters and synergies for every hero",
                    "Curated Overwatch counter picks and synergies for every hero, with short explanations.",
                    "Counters", true),
            new StaticSeoPage("/perks", "Overwatch hero perks: every Minor and Major perk",
                    "Every Overwatch hero perk in one place, with Minor and Major slots and descriptions.",
                    "Perks", true),
            new StaticSeoPage("/maps", "Overwatch maps: hero win rates by map",
                    "Overwatch maps by game mode, with hero win, pick and ban rates on each map.", "Maps", true),
            new StaticSeoPage("/changes", "Overwatch hero win rate changes by patch",
                    "See which Overwatch heroes gained or lost win and pick rate between patches "
                            + "and over the last weeks.", "What changed", true),
            new StaticSeoPage("/privacy", "Privacy policy", "How Overlab handles your data.", "Privacy policy",
                    false),
            new StaticSeoPage("/terms", "Terms of use", "The rules for using Overlab.", "Terms of use", false),
            new StaticSeoPage("/cookies", "Cookie policy", "Which cookies and local storage Overlab uses.",
                    "Cookie policy", false),
            new StaticSeoPage("/business", "Sponsorship and business",
                    "Contact Overlab about sponsorship and partnerships.", "Sponsorship and business", false));

    static Optional<StaticSeoPage> find(String path) {
        return ALL.stream().filter(page -> page.path().equals(path)).findFirst();
    }

    static List<StaticSeoPage> navigationPages() {
        return ALL.stream().filter(StaticSeoPage::navigation).toList();
    }
}
