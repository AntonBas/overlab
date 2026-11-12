package gg.overlab.backend.hero;

import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.config.cache.CacheNames;
import gg.overlab.backend.config.cache.EvictContentCaches;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.dto.HeroAdminDto;
import gg.overlab.backend.hero.dto.HeroDto;
import gg.overlab.backend.hero.dto.HeroUpdateRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HeroService {

    private final HeroRepository heroRepository;
    private final HeroMapper heroMapper;
    private final AuditService auditService;

    @Cacheable(value = CacheNames.HEROES, key = "'all'")
    @Transactional(readOnly = true)
    public List<HeroDto> findAll() {
        return heroRepository.findAllByActiveTrueOrderByNameAsc().stream()
                .map(heroMapper::toDto)
                .toList();
    }

    @Cacheable(value = CacheNames.HEROES, key = "#slug")
    @Transactional(readOnly = true)
    public HeroDto getBySlug(String slug) {
        Hero hero = heroRepository.findBySlug(slug)
                .orElseThrow(() -> new EntityNotFoundException("Hero", slug));
        return heroMapper.toDto(hero);
    }

    @Transactional(readOnly = true)
    public List<HeroAdminDto> findAllForAdmin() {
        return heroRepository.findAll(Sort.by("name")).stream().map(heroMapper::toAdminDto).toList();
    }

    @EvictContentCaches
    @Transactional
    public HeroAdminDto update(String slug, HeroUpdateRequest request) {
        Hero hero = heroRepository.findBySlug(slug)
                .orElseThrow(() -> new EntityNotFoundException("Hero", slug));
        HeroAdminDto before = heroMapper.toAdminDto(hero);
        hero.setDescription(request.description());
        hero.setStrengths(request.strengths());
        hero.setWeaknesses(request.weaknesses());
        hero.setActive(request.active());
        HeroAdminDto after = heroMapper.toAdminDto(hero);
        auditService.logUpdate("Hero", slug, before, after);
        return after;
    }
}
