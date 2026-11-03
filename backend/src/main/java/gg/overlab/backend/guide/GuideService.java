package gg.overlab.backend.guide;

import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.common.SlugService;
import gg.overlab.backend.config.cache.CacheNames;
import gg.overlab.backend.config.cache.EvictContentCaches;
import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.gamemap.GameMap;
import gg.overlab.backend.gamemap.GameMapRepository;
import gg.overlab.backend.guide.dto.GuideDto;
import gg.overlab.backend.guide.dto.GuideRequest;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class GuideService {

    private static final String AUDIT_TYPE = "Guide";
    private static final Pattern PATH_PATTERN = Pattern.compile("^(\\d+)(?:-.*)?$");

    private final GuideRepository guideRepository;
    private final HeroRepository heroRepository;
    private final GameMapRepository gameMapRepository;
    private final GuideMapper guideMapper;
    private final SlugService slugService;
    private final AuditService auditService;

    @Cacheable(value = CacheNames.CONTENT, key = "'guides:' + #heroSlug + ':' + #mapSlug")
    @Transactional(readOnly = true)
    public List<GuideDto> findPublished(String heroSlug, String mapSlug) {
        List<Guide> guides;
        if (heroSlug != null && mapSlug != null) {
            guides = guideRepository.findAllByHeroSlugAndMapSlugAndPublishedTrueOrderBySortOrderAscIdAsc(heroSlug, mapSlug);
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
        Matcher matcher = PATH_PATTERN.matcher(path);
        if (!matcher.matches()) {
            throw new EntityNotFoundException("Guide", path);
        }
        Long id = Long.valueOf(matcher.group(1));
        return guideRepository.findWithDetailsById(id)
                .filter(Guide::isPublished)
                .map(guideMapper::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Guide", path));
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
                : slugService.generateUnique(request.title(), guideRepository::existsBySlug));
        apply(guide, request);
        GuideDto created = toDto(guideRepository.save(guide));
        auditService.logCreate(AUDIT_TYPE, created.id(), created);
        return created;
    }

    @EvictContentCaches
    @Transactional
    public GuideDto update(Long id, GuideRequest request) {
        Guide guide = guideRepository.findWithDetailsById(id)
                .orElseThrow(() -> new EntityNotFoundException("Guide", id));
        GuideDto before = toDto(guide);
        if (StringUtils.hasText(request.slug()) && !request.slug().equals(guide.getSlug())) {
            guide.setSlug(requireFreeSlug(request.slug(), id));
        }
        apply(guide, request);
        GuideDto after = toDto(guide);
        auditService.logUpdate(AUDIT_TYPE, id, before, after);
        return after;
    }

    @EvictContentCaches
    @Transactional
    public void delete(Long id) {
        Guide guide = guideRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Guide", id));
        auditService.logDelete(AUDIT_TYPE, id, guideMapper.toDto(guide));
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
        guide.setAbilitySlug(StringUtils.hasText(request.abilitySlug()) ? request.abilitySlug() : null);
        guide.setDescription(request.description());
        guide.setSortOrder(request.sortOrder() == null ? 0 : request.sortOrder());
        guide.setPublished(Boolean.TRUE.equals(request.published()));
    }

    private String requireFreeSlug(String slug, Long excludedId) {
        boolean taken = excludedId == null
                ? guideRepository.existsBySlug(slug)
                : guideRepository.existsBySlugAndIdNot(slug, excludedId);
        if (taken) {
            throw new ConflictException("Slug is already used: " + slug);
        }
        return slug;
    }

    private GuideDto toDto(Guide guide) {
        return guideMapper.toDto(guide);
    }
}
