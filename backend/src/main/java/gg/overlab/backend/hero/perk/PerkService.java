package gg.overlab.backend.hero.perk;

import gg.overlab.backend.config.cache.CacheNames;
import gg.overlab.backend.config.cache.EvictContentCaches;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.perk.dto.PerkDto;
import gg.overlab.backend.hero.perk.dto.PerkRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PerkService {

    private final PerkRepository perkRepository;
    private final HeroRepository heroRepository;
    private final PerkMapper perkMapper;

    @Cacheable(value = CacheNames.CONTENT, key = "'perks:' + #heroSlug")
    @Transactional(readOnly = true)
    public List<PerkDto> findByHero(String heroSlug) {
        findHero(heroSlug);
        return perkRepository.findAllByHeroSlugOrderBySlotAscNameAsc(heroSlug).stream()
                .map(perkMapper::toDto)
                .toList();
    }

    @EvictContentCaches
    @Transactional
    public PerkDto create(PerkRequest request) {
        Hero hero = findHero(request.heroSlug());
        if (perkRepository.existsByHeroIdAndNameIgnoreCase(hero.getId(), request.name().trim())) {
            throw new ConflictException("Perk already exists for this hero: " + request.name());
        }
        Perk perk = new Perk();
        perk.setHero(hero);
        perkMapper.apply(request, perk);
        return perkMapper.toDto(perkRepository.save(perk));
    }

    @EvictContentCaches
    @Transactional
    public PerkDto update(Long id, PerkRequest request) {
        Perk perk = perkRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Perk", id));
        Hero hero = findHero(request.heroSlug());
        if (perkRepository.existsByHeroIdAndNameIgnoreCaseAndIdNot(hero.getId(), request.name().trim(), id)) {
            throw new ConflictException("Perk already exists for this hero: " + request.name());
        }
        perk.setHero(hero);
        perkMapper.apply(request, perk);
        return perkMapper.toDto(perk);
    }

    @EvictContentCaches
    @Transactional
    public void delete(Long id) {
        Perk perk = perkRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Perk", id));
        perkRepository.delete(perk);
    }

    private Hero findHero(String slug) {
        return heroRepository.findBySlug(slug).orElseThrow(() -> new EntityNotFoundException("Hero", slug));
    }
}
