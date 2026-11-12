package gg.overlab.backend.collector.imports;

import gg.overlab.backend.collector.parser.ParsedPerk;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.perk.Perk;
import gg.overlab.backend.hero.perk.PerkPosition;
import gg.overlab.backend.hero.perk.PerkRecommendation;
import gg.overlab.backend.hero.perk.PerkRepository;
import gg.overlab.backend.media.ImageStore;
import gg.overlab.backend.media.MediaFolder;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class PerkImportWriter {

    private final HeroRepository heroRepository;
    private final PerkRepository perkRepository;
    private final ImageStore imageStore;

    @Transactional(readOnly = true)
    public Set<String> missingIconUrls(String heroSlug, List<ParsedPerk> parsedPerks) {
        Hero hero = heroRepository.findBySlug(heroSlug)
                .orElseThrow(() -> new EntityNotFoundException("Hero", heroSlug));
        return parsedPerks.stream()
                .filter(parsed -> parsed.iconUrl() != null)
                .filter(parsed -> perkRepository.findByHeroIdAndNameIgnoreCase(hero.getId(), parsed.name())
                        .map(perk -> perk.getIconUrl() == null)
                        .orElse(true))
                .map(ParsedPerk::iconUrl)
                .collect(Collectors.toSet());
    }

    @Transactional
    public ImportCounts write(String heroSlug, List<ParsedPerk> parsedPerks,
                        Function<String, Optional<byte[]>> iconLoader) {
        Hero hero = heroRepository.findBySlug(heroSlug)
                .orElseThrow(() -> new EntityNotFoundException("Hero", heroSlug));
        boolean heroHadPerks = perkRepository.existsByHeroId(hero.getId());
        int created = 0;
        int updated = 0;
        for (ParsedPerk parsed : parsedPerks) {
            Perk perk = perkRepository.findByHeroIdAndNameIgnoreCase(hero.getId(), parsed.name()).orElse(null);
            boolean isNew = perk == null;
            boolean changed = false;
            if (isNew) {
                Optional<PerkPosition> position = freePosition(hero, parsed);
                if (position.isEmpty()) {
                    continue;
                }
                perk = newPerk(hero, parsed, position.get(), heroHadPerks);
            } else if (perk.isImported()) {
                changed = refreshImported(perk, parsed);
            } else if (isBlank(perk.getDescription()) && parsed.description() != null) {
                perk.setDescription(parsed.description());
                changed = true;
            }
            if (perk.getIconUrl() == null && parsed.iconUrl() != null) {
                Perk target = perk;
                Optional<byte[]> icon = iconLoader.apply(parsed.iconUrl());
                if (icon.isPresent()) {
                    target.setIconUrl(imageStore.replace(MediaFolder.PERKS, "perk-" + target.getId(), null,
                            icon.get()));
                    changed = true;
                }
            }
            if (isNew) {
                created++;
            } else if (changed) {
                updated++;
            }
        }
        int removed = removeStaleImportedPerks(hero, parsedPerks);
        return new ImportCounts(created, updated, removed);
    }

    private Optional<PerkPosition> freePosition(Hero hero, ParsedPerk parsed) {
        PerkPosition other = parsed.position() == PerkPosition.LEFT ? PerkPosition.RIGHT : PerkPosition.LEFT;
        return Stream.of(parsed.position(), other)
                .filter(position -> !perkRepository.existsByHeroIdAndSlotAndPosition(hero.getId(), parsed.slot(),
                        position))
                .findFirst();
    }

    private Perk newPerk(Hero hero, ParsedPerk parsed, PerkPosition position, boolean heroHadPerks) {
        Perk perk = new Perk();
        perk.setHero(hero);
        perk.setName(parsed.name());
        perk.setSlot(parsed.slot());
        perk.setPosition(position);
        perk.setRecommendation(PerkRecommendation.OPTIONAL);
        perk.setDescription(parsed.description());
        perk.setImported(true);
        perk.setImportedDescription(parsed.description());
        if (heroHadPerks) {
            perk.setIntroducedAt(Instant.now());
        }
        return perkRepository.save(perk);
    }

    private boolean refreshImported(Perk perk, ParsedPerk parsed) {
        boolean changed = false;
        if (perk.getSlot() != parsed.slot()) {
            perk.setSlot(parsed.slot());
            changed = true;
        }
        if (parsed.description() != null && !parsed.description().equals(perk.getImportedDescription())) {
            boolean untouchedByEditors = isBlank(perk.getDescription())
                    || perk.getDescription().equals(perk.getImportedDescription());
            if (untouchedByEditors) {
                perk.setDescription(parsed.description());
            }
            perk.setImportedDescription(parsed.description());
            changed = true;
        }
        return changed;
    }

    private int removeStaleImportedPerks(Hero hero, List<ParsedPerk> parsedPerks) {
        if (parsedPerks.isEmpty()) {
            return 0;
        }
        Set<String> currentNames = parsedPerks.stream()
                .map(parsed -> parsed.name().toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());
        List<Perk> imported = perkRepository.findAllByHeroSlugOrderBySlotAscPositionAscNameAsc(hero.getSlug())
                .stream().filter(Perk::isImported).toList();
        if (parsedPerks.size() * 2 < imported.size()) {
            return 0;
        }
        List<Perk> stale = imported.stream()
                .filter(perk -> !currentNames.contains(perk.getName().toLowerCase(Locale.ROOT)))
                .toList();
        stale.forEach(perk -> imageStore.remove(perk.getIconUrl()));
        perkRepository.deleteAll(stale);
        return stale.size();
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
