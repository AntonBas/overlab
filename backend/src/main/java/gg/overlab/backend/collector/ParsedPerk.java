package gg.overlab.backend.collector;

import gg.overlab.backend.hero.perk.PerkSlot;

public record ParsedPerk(PerkSlot slot, String name, String description, String iconUrl) {
}
