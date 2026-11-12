package gg.overlab.backend.hero.perk;

import gg.overlab.backend.audit.AuditEntityType;
import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.config.cache.CacheNames;
import gg.overlab.backend.config.cache.EvictContentCaches;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.perk.dto.PerkDto;
import gg.overlab.backend.hero.perk.dto.PerkRequest;
import gg.overlab.backend.media.ImageStore;
import gg.overlab.backend.media.MediaFolder;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class PerkService {

    private final PerkRepository perkRepository;
    private final HeroRepository heroRepository;
    private final PerkMapper perkMapper;
    private final AuditService auditService;
    private final ImageStore imageStore;

    @Cacheable(value = CacheNames.CONTENT, key = "'perks:all'")
    @Transactional(readOnly = true)
    public List<PerkDto> findAll() {
        return perkRepository.findAllByOrderByHeroNameAscSlotAscPositionAsc().stream()
                .map(perkMapper::toDto)
                .toList();
    }

    @Cacheable(value = CacheNames.CONTENT, key = "'perks:' + #heroSlug")
    @Transactional(readOnly = true)
    public List<PerkDto> findByHero(String heroSlug) {
        findHero(heroSlug);
        return perkRepository.findAllByHeroSlugOrderBySlotAscPositionAscNameAsc(heroSlug).stream()
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
        if (perkRepository.existsByHeroIdAndSlotAndPosition(hero.getId(), request.slot(), request.position())) {
            throw new ConflictException(positionTakenMessage(request));
        }
        Perk perk = new Perk();
        perk.setHero(hero);
        perkMapper.apply(request, perk);
        PerkDto created = perkMapper.toDto(perkRepository.save(perk));
        auditService.logCreate(AuditEntityType.PERK, created.id(), created);
        return created;
    }

    @EvictContentCaches
    @Transactional
    public PerkDto update(Long id, PerkRequest request) {
        Perk perk = perkRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Perk", id));
        Hero hero = findHero(request.heroSlug());
        if (perkRepository.existsByHeroIdAndNameIgnoreCaseAndIdNot(hero.getId(), request.name().trim(), id)) {
            throw new ConflictException("Perk already exists for this hero: " + request.name());
        }
        if (perkRepository.existsByHeroIdAndSlotAndPositionAndIdNot(hero.getId(), request.slot(),
                request.position(), id)) {
            throw new ConflictException(positionTakenMessage(request));
        }
        PerkDto before = perkMapper.toDto(perk);
        perk.setHero(hero);
        perkMapper.apply(request, perk);
        PerkDto after = perkMapper.toDto(perk);
        auditService.logUpdate(AuditEntityType.PERK, id, before, after);
        return after;
    }

    @EvictContentCaches
    @Transactional
    public void delete(Long id) {
        Perk perk = perkRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Perk", id));
        auditService.logDelete(AuditEntityType.PERK, id, perkMapper.toDto(perk));
        perkRepository.delete(perk);
        imageStore.remove(perk.getIconUrl());
    }

    @EvictContentCaches
    @Transactional
    public PerkDto replaceIcon(Long id, MultipartFile file) {
        Perk perk = perkRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Perk", id));
        PerkDto before = perkMapper.toDto(perk);
        perk.setIconUrl(imageStore.replace(MediaFolder.PERKS, "perk-" + id, perk.getIconUrl(), file));
        PerkDto after = perkMapper.toDto(perk);
        auditService.logUpdate(AuditEntityType.PERK, id, before, after);
        return after;
    }

    @EvictContentCaches
    @Transactional
    public PerkDto removeIcon(Long id) {
        Perk perk = perkRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Perk", id));
        PerkDto before = perkMapper.toDto(perk);
        imageStore.remove(perk.getIconUrl());
        perk.setIconUrl(null);
        PerkDto after = perkMapper.toDto(perk);
        auditService.logUpdate(AuditEntityType.PERK, id, before, after);
        return after;
    }

    private String positionTakenMessage(PerkRequest request) {
        return "This hero already has a " + request.slot().name().toLowerCase() + " perk on the "
                + request.position().name().toLowerCase();
    }

    private Hero findHero(String slug) {
        return heroRepository.findBySlug(slug).orElseThrow(() -> new EntityNotFoundException("Hero", slug));
    }
}
