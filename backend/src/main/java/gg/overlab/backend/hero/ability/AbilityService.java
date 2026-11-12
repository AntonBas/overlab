package gg.overlab.backend.hero.ability;

import gg.overlab.backend.audit.AuditEntityType;
import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.config.cache.CacheNames;
import gg.overlab.backend.config.cache.EvictContentCaches;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.ability.dto.AbilityAdminDto;
import gg.overlab.backend.hero.ability.dto.AbilityControlRequest;
import gg.overlab.backend.hero.ability.dto.AbilityDto;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AbilityService {

    private final HeroAbilityRepository abilityRepository;
    private final HeroRepository heroRepository;
    private final AbilityMapper abilityMapper;
    private final AuditService auditService;

    @Cacheable(value = CacheNames.CONTENT, key = "'abilities:all'")
    @Transactional(readOnly = true)
    public List<AbilityDto> findAll() {
        return abilityRepository.findAllByOrderByHeroNameAscSortOrderAsc().stream()
                .map(abilityMapper::toDto)
                .toList();
    }

    @Cacheable(value = CacheNames.CONTENT, key = "'abilities:' + #heroSlug")
    @Transactional(readOnly = true)
    public List<AbilityDto> findByHero(String heroSlug) {
        heroRepository.findBySlug(heroSlug).orElseThrow(() -> new EntityNotFoundException("Hero", heroSlug));
        return abilityRepository.findAllByHeroSlugOrderBySortOrderAsc(heroSlug).stream()
                .map(abilityMapper::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AbilityAdminDto> findForAdmin(String heroSlug) {
        heroRepository.findBySlug(heroSlug).orElseThrow(() -> new EntityNotFoundException("Hero", heroSlug));
        return abilityRepository.findAllByHeroSlugOrderBySortOrderAsc(heroSlug).stream()
                .map(abilityMapper::toAdminDto)
                .toList();
    }

    @EvictContentCaches
    @Transactional
    public AbilityAdminDto updateControl(Long id, AbilityControlRequest request) {
        HeroAbility ability = abilityRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Ability", id));
        AbilityAdminDto before = abilityMapper.toAdminDto(ability);
        ability.setControl(request.control());
        AbilityAdminDto after = abilityMapper.toAdminDto(ability);
        auditService.logUpdate(AuditEntityType.ABILITY, id, before, after);
        return after;
    }
}
