package gg.overlab.backend.patch;

import gg.overlab.backend.audit.AuditEntityType;
import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.common.SlugService;
import gg.overlab.backend.config.cache.CacheNames;
import gg.overlab.backend.config.cache.EvictContentCaches;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.patch.dto.PatchDto;
import gg.overlab.backend.patch.dto.PatchRequest;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class PatchService {

    private final PatchRepository patchRepository;
    private final PatchMapper patchMapper;
    private final SlugService slugService;
    private final AuditService auditService;

    @Cacheable(value = CacheNames.CONTENT, key = "'patches:all'")
    @Transactional(readOnly = true)
    public List<PatchDto> findAll() {
        List<Patch> patches = patchRepository.findAllByOrderByReleasedAtDesc();
        Map<Long, Integer> seasons = PatchSeasons.resolve(patches);
        return patches.stream().map(patch -> patchMapper.toDto(patch, seasons.get(patch.getId()))).toList();
    }

    @Cacheable(value = CacheNames.CONTENT, key = "'patch:' + #slug")
    @Transactional(readOnly = true)
    public PatchDto getBySlug(String slug) {
        return patchRepository.findBySlug(slug).map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Patch", slug));
    }

    @Transactional(readOnly = true)
    public PatchDto findActiveAt(Instant moment) {
        return patchRepository.findFirstByReleasedAtLessThanEqualOrderByReleasedAtDesc(moment)
                .map(this::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Patch active at", moment));
    }

    @Transactional(readOnly = true)
    public Optional<PatchDto> findNextAfter(Instant moment) {
        return patchRepository.findFirstByReleasedAtGreaterThanOrderByReleasedAtAsc(moment).map(this::toDto);
    }

    @EvictContentCaches
    @Transactional
    public PatchDto create(PatchRequest request) {
        if (patchRepository.existsByVersionIgnoreCase(request.version().trim())) {
            throw new ConflictException("Patch already exists: " + request.version());
        }
        Patch patch = new Patch();
        patchMapper.apply(request, patch);
        patch.setSlug(StringUtils.hasText(request.slug())
                ? requireFreeSlug(request.slug(), null)
                : slugService.generateUnique(request.version(), patchRepository::existsBySlug));
        PatchDto created = toDto(patchRepository.save(patch));
        auditService.logCreate(AuditEntityType.PATCH, created.id(), created);
        return created;
    }

    @EvictContentCaches
    @Transactional
    public PatchDto update(Long id, PatchRequest request) {
        Patch patch = patchRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Patch", id));
        if (patchRepository.existsByVersionIgnoreCaseAndIdNot(request.version().trim(), id)) {
            throw new ConflictException("Patch already exists: " + request.version());
        }
        PatchDto before = toDto(patch);
        patchMapper.apply(request, patch);
        if (StringUtils.hasText(request.slug()) && !request.slug().equals(patch.getSlug())) {
            patch.setSlug(requireFreeSlug(request.slug(), id));
        }
        PatchDto after = toDto(patch);
        auditService.logUpdate(AuditEntityType.PATCH, id, before, after);
        return after;
    }

    @EvictContentCaches
    @Transactional
    public void delete(Long id) {
        Patch patch = patchRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Patch", id));
        auditService.logDelete(AuditEntityType.PATCH, id, toDto(patch));
        patchRepository.delete(patch);
    }

    private PatchDto toDto(Patch patch) {
        Map<Long, Integer> seasons = PatchSeasons.resolve(patchRepository.findAllByOrderByReleasedAtDesc());
        return patchMapper.toDto(patch, seasons.get(patch.getId()));
    }

    private String requireFreeSlug(String slug, Long excludedId) {
        return slugService.requireFree(slug, candidate -> excludedId == null
                ? patchRepository.existsBySlug(candidate)
                : patchRepository.existsBySlugAndIdNot(candidate, excludedId));
    }
}
