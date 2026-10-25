package gg.overlab.backend.patch;

import gg.overlab.backend.common.SlugService;
import gg.overlab.backend.config.cache.CacheNames;
import gg.overlab.backend.config.cache.EvictContentCaches;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.patch.dto.PatchDto;
import gg.overlab.backend.patch.dto.PatchRequest;
import java.time.Instant;
import java.util.List;
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

    @Cacheable(value = CacheNames.CONTENT, key = "'patches:all'")
    @Transactional(readOnly = true)
    public List<PatchDto> findAll() {
        return patchRepository.findAllByOrderByReleasedAtDesc().stream().map(patchMapper::toDto).toList();
    }

    @Cacheable(value = CacheNames.CONTENT, key = "'patch:' + #slug")
    @Transactional(readOnly = true)
    public PatchDto getBySlug(String slug) {
        return patchRepository.findBySlug(slug).map(patchMapper::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Patch", slug));
    }

    @Transactional(readOnly = true)
    public PatchDto findActiveAt(Instant moment) {
        return patchRepository.findFirstByReleasedAtLessThanEqualOrderByReleasedAtDesc(moment)
                .map(patchMapper::toDto)
                .orElseThrow(() -> new EntityNotFoundException("Patch active at", moment));
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
        return patchMapper.toDto(patchRepository.save(patch));
    }

    @EvictContentCaches
    @Transactional
    public PatchDto update(Long id, PatchRequest request) {
        Patch patch = patchRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Patch", id));
        if (patchRepository.existsByVersionIgnoreCaseAndIdNot(request.version().trim(), id)) {
            throw new ConflictException("Patch already exists: " + request.version());
        }
        patchMapper.apply(request, patch);
        if (StringUtils.hasText(request.slug()) && !request.slug().equals(patch.getSlug())) {
            patch.setSlug(requireFreeSlug(request.slug(), id));
        }
        return patchMapper.toDto(patch);
    }

    @EvictContentCaches
    @Transactional
    public void delete(Long id) {
        Patch patch = patchRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Patch", id));
        patchRepository.delete(patch);
    }

    private String requireFreeSlug(String slug, Long excludedId) {
        boolean taken = excludedId == null
                ? patchRepository.existsBySlug(slug)
                : patchRepository.existsBySlugAndIdNot(slug, excludedId);
        if (taken) {
            throw new ConflictException("Slug is already used: " + slug);
        }
        return slug;
    }
}
