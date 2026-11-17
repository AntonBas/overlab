package gg.overlab.backend.guide;

import gg.overlab.backend.audit.AuditEntityType;
import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.common.SlugService;
import gg.overlab.backend.config.cache.CacheNames;
import gg.overlab.backend.config.cache.EvictContentCaches;
import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.gamemap.GameMap;
import gg.overlab.backend.gamemap.GameMapRepository;
import gg.overlab.backend.guide.dto.GuideDto;
import gg.overlab.backend.guide.dto.GuideRequest;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.ability.HeroAbilityRepository;
import gg.overlab.backend.hero.HeroRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class GuideService {

    private static final int MAX_SLUG_LENGTH = 200;

    private final GuideRepository guideRepository;
    private final HeroRepository heroRepository;
    private final GameMapRepository gameMapRepository;
    private final HeroAbilityRepository abilityRepository;
    private final GuideMapper guideMapper;
    private final SlugService slugService;
    private final AuditService auditService;

    @Cacheable(value = CacheNames.CONTENT, key = "'guides:' + #heroSlug + ':' + #mapSlug",
            unless = "#result.isEmpty()")
    @Transactional(readOnly = true)
    public List<GuideDto> findPublished(String heroSlug, String mapSlug) {
        List<Guide> guides;
        if (heroSlug != null && mapSlug != null) {
            guides = guideRepository
                    .findAllByHeroSlugAndMapSlugAndPublishedTrueOrderBySortOrderAscIdAsc(heroSlug, mapSlug);
        } else if (heroSlug != null) {
            guides = guideRepository.findAllByHeroSlugAndPublishedTrueOrderBySortOrderAscIdAsc(heroSlug);
        } else if (mapSlug != null) {
            guides = guideRepository.findAllByMapSlugAndPublishedTrueOrderBySortOrderAscIdAsc(mapSlug);
        } else {
            guides = guideRepository.findAllByPublishedTrueOrderBySortOrderAscIdAsc();
        }
        return guides.stream().map(guideMapper::toDto).toList();
    }

    @Cacheable(value = CacheNames.CONTENT, key = "'guide:' + #path")
    @Transactional(readOnly = true)
    public GuideDto getPublishedByPath(String path) {
        return findBySlugOrLegacyId(path)
                .filter(Guide::isPublished)
                .map(guideMapper::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Guide", path));
    }

    private Optional<Guide> findBySlugOrLegacyId(String path) {
        Optional<Guide> bySlug = guideRepository.findWithDetailsBySlug(path);
        if (bySlug.isPresent()) {
            return bySlug;
        }
        return GuidePath.legacyId(path).flatMap(guideRepository::findWithDetailsById);
    }

    private String generateSlug(GuideRequest request) {
        String title = request.title();
        List<String> candidates = new ArrayList<>();
        candidates.add(title);
        candidates.add(withPrefix(request.heroSlug(), title));
        if (StringUtils.hasText(request.mapSlug())) {
            candidates.add(withPrefix(request.mapSlug(), candidates.getLast()));
        }
        List<String> distinct = candidates.stream().distinct().toList();
        for (String candidate : distinct.subList(0, distinct.size() - 1)) {
            String slug = slugService.generate(candidate);
            if (slug.length() <= MAX_SLUG_LENGTH && !guideRepository.existsBySlug(slug)) {
                return slug;
            }
        }
        return slugService.generateUnique(distinct.getLast(), MAX_SLUG_LENGTH, guideRepository::existsBySlug);
    }

    private String withPrefix(String prefixSlug, String text) {
        String normalizedText = "-" + slugService.generate(text) + "-";
        return normalizedText.contains("-" + prefixSlug + "-") ? text : prefixSlug + " " + text;
    }

    @Transactional(readOnly = true)
    public List<GuideDto> findAllForAdmin() {
        return guideRepository.findAllByOrderByIdAsc().stream().map(guideMapper::toDto).toList();
    }

    @EvictContentCaches
    @Transactional
    public GuideDto create(GuideRequest request) {
        Guide guide = new Guide();
        guide.setSlug(StringUtils.hasText(request.slug())
                ? requireFreeSlug(request.slug(), null)
                : generateSlug(request));
        apply(guide, request);
        GuideDto created = guideMapper.toDto(guideRepository.save(guide));
        auditService.logCreate(AuditEntityType.GUIDE, created.id(), created);
        return created;
    }

    @EvictContentCaches
    @Transactional
    public GuideDto update(Long id, GuideRequest request) {
        Guide guide = guideRepository.findWithDetailsById(id)
                .orElseThrow(() -> new EntityNotFoundException("Guide", id));
        GuideDto before = guideMapper.toDto(guide);
        if (StringUtils.hasText(request.slug()) && !request.slug().equals(guide.getSlug())) {
            guide.setSlug(requireFreeSlug(request.slug(), id));
        }
        apply(guide, request);
        GuideDto after = guideMapper.toDto(guide);
        auditService.logUpdate(AuditEntityType.GUIDE, id, before, after);
        return after;
    }

    @EvictContentCaches
    @Transactional
    public void delete(Long id) {
        Guide guide = guideRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Guide", id));
        auditService.logDelete(AuditEntityType.GUIDE, id, guideMapper.toDto(guide));
        guideRepository.delete(guide);
    }

    private void apply(Guide guide, GuideRequest request) {
        Hero hero = heroRepository.findBySlug(request.heroSlug())
                .orElseThrow(() -> new EntityNotFoundException("Hero", request.heroSlug()));
        GameMap map = StringUtils.hasText(request.mapSlug())
                ? gameMapRepository.findBySlug(request.mapSlug())
                .orElseThrow(() -> new EntityNotFoundException("Map", request.mapSlug()))
                : null;
        guide.setHero(hero);
        guide.setMap(map);
        guide.setTitle(request.title().trim());
        guide.setYoutubeId(request.youtubeId());
        guide.setStartSeconds(request.startSeconds() == null ? 0 : request.startSeconds());
        if (request.endSeconds() != null && request.endSeconds() <= guide.getStartSeconds()) {
            throw new BadRequestException("End time must be after the start time");
        }
        guide.setEndSeconds(request.endSeconds());
        guide.setKind(request.kind() == null ? GuideKind.TIP : request.kind());
        guide.setSide(request.side() == null ? GuideSide.BOTH : request.side());
        String abilitySlug = StringUtils.hasText(request.abilitySlug()) ? request.abilitySlug() : null;
        if (abilitySlug != null && !abilityRepository.existsByHeroIdAndSlug(hero.getId(), abilitySlug)) {
            throw new BadRequestException("The ability does not belong to the chosen hero");
        }
        guide.setAbilitySlug(abilitySlug);
        guide.setDescription(request.description());
        guide.setSortOrder(request.sortOrder() == null ? 0 : request.sortOrder());
        guide.setPublished(Boolean.TRUE.equals(request.published()));
    }

    private String requireFreeSlug(String slug, Long excludedId) {
        return slugService.requireFree(slug, candidate -> excludedId == null
                ? guideRepository.existsBySlug(candidate)
                : guideRepository.existsBySlugAndIdNot(candidate, excludedId));
    }
}
