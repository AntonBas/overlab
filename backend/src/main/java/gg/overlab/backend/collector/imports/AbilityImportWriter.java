package gg.overlab.backend.collector.imports;

import gg.overlab.backend.collector.parser.ParsedAbility;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.ability.HeroAbility;
import gg.overlab.backend.hero.ability.HeroAbilityRepository;
import gg.overlab.backend.media.ImageStore;
import gg.overlab.backend.media.MediaFolder;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class AbilityImportWriter {

    private final HeroRepository heroRepository;
    private final HeroAbilityRepository abilityRepository;
    private final ImageStore imageStore;

    @Transactional(readOnly = true)
    public Set<String> missingIconUrls(String heroSlug, List<ParsedAbility> parsedAbilities) {
        Hero hero = heroRepository.findBySlug(heroSlug)
                .orElseThrow(() -> new EntityNotFoundException("Hero", heroSlug));
        return parsedAbilities.stream()
                .filter(parsed -> parsed.iconUrl() != null)
                .filter(parsed -> abilityRepository.findByHeroIdAndSlug(hero.getId(), parsed.slug())
                        .map(ability -> ability.getIconUrl() == null)
                        .orElse(true))
                .map(ParsedAbility::iconUrl)
                .collect(Collectors.toSet());
    }

    @Transactional
    public ImportCounts write(String heroSlug, List<ParsedAbility> parsedAbilities,
                                         Function<String, Optional<byte[]>> iconLoader) {
        Hero hero = heroRepository.findBySlug(heroSlug)
                .orElseThrow(() -> new EntityNotFoundException("Hero", heroSlug));
        boolean heroHadAbilities = abilityRepository.existsByHeroId(hero.getId());
        int created = 0;
        int updated = 0;
        for (ParsedAbility parsed : parsedAbilities) {
            HeroAbility ability = abilityRepository.findByHeroIdAndSlug(hero.getId(), parsed.slug()).orElse(null);
            boolean isNew = ability == null;
            if (isNew) {
                ability = new HeroAbility();
                ability.setHero(hero);
                ability.setSlug(parsed.slug());
                if (heroHadAbilities) {
                    ability.setIntroducedAt(Instant.now());
                }
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
        int removed = removeStale(heroSlug, parsedAbilities);
        return new ImportCounts(created, updated, removed);
    }

    private int removeStale(String heroSlug, List<ParsedAbility> parsedAbilities) {
        if (parsedAbilities.isEmpty()) {
            return 0;
        }
        Set<String> currentSlugs = parsedAbilities.stream().map(ParsedAbility::slug).collect(Collectors.toSet());
        List<HeroAbility> stale = abilityRepository.findAllByHeroSlugOrderBySortOrderAsc(heroSlug).stream()
                .filter(ability -> !currentSlugs.contains(ability.getSlug()))
                .toList();
        stale.forEach(ability -> imageStore.remove(ability.getIconUrl()));
        abilityRepository.deleteAll(stale);
        return stale.size();
    }
}
