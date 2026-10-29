package gg.overlab.backend.collector;

import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.perk.Perk;
import gg.overlab.backend.hero.perk.PerkRecommendation;
import gg.overlab.backend.hero.perk.PerkRepository;
import gg.overlab.backend.media.ImageStore;
import gg.overlab.backend.media.MediaFolder;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class PerkImportWriter {

    private final HeroRepository heroRepository;
    private final PerkRepository perkRepository;
    private final ImageStore imageStore;

    public record Counts(int created, int updated) {
    }

    @Transactional
    public Counts write(String heroSlug, List<ParsedPerk> parsedPerks,
                        Function<String, Optional<byte[]>> iconLoader) {
        Hero hero = heroRepository.findBySlug(heroSlug)
                .orElseThrow(() -> new EntityNotFoundException("Hero", heroSlug));
        int created = 0;
        int updated = 0;
        for (ParsedPerk parsed : parsedPerks) {
            Perk perk = perkRepository.findByHeroIdAndNameIgnoreCase(hero.getId(), parsed.name()).orElse(null);
            boolean isNew = perk == null;
            boolean changed = false;
            if (isNew) {
                perk = new Perk();
                perk.setHero(hero);
                perk.setName(parsed.name());
                perk.setSlot(parsed.slot());
                perk.setPosition(parsed.position());
                perk.setRecommendation(PerkRecommendation.OPTIONAL);
                perk.setDescription(parsed.description());
                perk = perkRepository.save(perk);
            } else if ((perk.getDescription() == null || perk.getDescription().isBlank())
                    && parsed.description() != null) {
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
        return new Counts(created, updated);
    }
}
