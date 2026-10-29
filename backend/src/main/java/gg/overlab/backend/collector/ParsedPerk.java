package gg.overlab.backend.collector;

import gg.overlab.backend.hero.perk.PerkPosition;
import gg.overlab.backend.hero.perk.PerkSlot;

public record ParsedPerk(PerkSlot slot, PerkPosition position, String name, String description, String iconUrl) {
}
