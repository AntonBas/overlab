package gg.overlab.backend.collector.parser;

import gg.overlab.backend.hero.ability.AbilityControl;

public record ParsedAbility(String slug, String name, String description, String iconUrl, int sortOrder,
                            AbilityControl defaultControl, boolean supplemental) {

    public ParsedAbility(String slug, String name, String description, String iconUrl, int sortOrder) {
        this(slug, name, description, iconUrl, sortOrder, null, false);
    }

    public ParsedAbility withSortOrder(int newSortOrder) {
        return new ParsedAbility(slug, name, description, iconUrl, newSortOrder, defaultControl, supplemental);
    }
}
