package gg.overlab.backend.collector;

import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.ability.HeroAbility;
import gg.overlab.backend.hero.ability.HeroAbilityRepository;
import gg.overlab.backend.media.ImageStore;
import gg.overlab.backend.media.MediaFolder;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class AbilityImportWriter {

    private final HeroRepository heroRepository;
    private final HeroAbilityRepository abilityRepository;
    private final ImageStore imageStore;

    @Transactional
    public PerkImportWriter.Counts write(String heroSlug, List<ParsedAbility> parsedAbilities,
                                         Function<String, Optional<byte[]>> iconLoader) {
        Hero hero = heroRepository.findBySlug(heroSlug)
                .orElseThrow(() -> new EntityNotFoundException("Hero", heroSlug));
        int created = 0;
        int updated = 0;
        for (ParsedAbility parsed : parsedAbilities) {
            HeroAbility ability = abilityRepository.findByHeroIdAndSlug(hero.getId(), parsed.slug()).orElse(null);
            boolean isNew = ability == null;
            if (isNew) {
                ability = new HeroAbility();
                ability.setHero(hero);
                ability.setSlug(parsed.slug());
            }
            boolean changed = isNew || !Objects.equals(ability.getName(), parsed.name())
                    || !Objects.equals(ability.getDescription(), parsed.description())
                    || ability.getSortOrder() != parsed.sortOrder();
            ability.setName(parsed.name());
            ability.setDescription(parsed.description());
            ability.setSortOrder(parsed.sortOrder());
            ability = abilityRepository.save(ability);
            if (ability.getIconUrl() == null && parsed.iconUrl() != null) {
                Optional<byte[]> icon = iconLoader.apply(parsed.iconUrl());
                if (icon.isPresent()) {
                    ability.setIconUrl(imageStore.replace(MediaFolder.ABILITIES, "ability-" + ability.getId(), null,
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
        return new PerkImportWriter.Counts(created, updated);
    }
}
