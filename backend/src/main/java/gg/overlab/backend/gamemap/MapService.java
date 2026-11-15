package gg.overlab.backend.gamemap;

import gg.overlab.backend.audit.AuditEntityType;
import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.config.cache.CacheNames;
import gg.overlab.backend.config.cache.EvictContentCaches;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.gamemap.dto.MapUpdateRequest;
import gg.overlab.backend.media.ImageStore;
import gg.overlab.backend.media.MediaFolder;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class MapService {

    private final GameMapRepository gameMapRepository;
    private final MapMapper mapMapper;
    private final AuditService auditService;
    private final ImageStore imageStore;

    @Cacheable(value = CacheNames.MAPS, key = "'all'")
    @Transactional(readOnly = true)
    public List<MapDto> findAll() {
        return gameMapRepository.findAllByOrderByNameAsc().stream()
                .map(mapMapper::toDto)
                .toList();
    }

    @Cacheable(value = CacheNames.MAPS, key = "'slug:' + #slug")
    @Transactional(readOnly = true)
    public MapDto getBySlug(String slug) {
        GameMap map = requireMap(slug);
        return mapMapper.toDto(map);
    }

    @EvictContentCaches
    @CacheEvict(value = CacheNames.STATS, allEntries = true)
    @Transactional
    public MapDto update(String slug, MapUpdateRequest request) {
        GameMap map = requireMap(slug);
        MapDto before = mapMapper.toDto(map);
        map.setMode(request.mode());
        MapDto after = mapMapper.toDto(map);
        auditService.logUpdate(AuditEntityType.MAP, slug, before, after);
        return after;
    }

    @EvictContentCaches
    @CacheEvict(value = CacheNames.STATS, allEntries = true)
    @Transactional
    public MapDto replaceImage(String slug, MultipartFile file) {
        GameMap map = requireMap(slug);
        MapDto before = mapMapper.toDto(map);
        map.setImageUrl(imageStore.replace(MediaFolder.MAPS, slug, map.getImageUrl(), file));
        MapDto after = mapMapper.toDto(map);
        auditService.logUpdate(AuditEntityType.MAP, slug, before, after);
        return after;
    }

    @EvictContentCaches
    @CacheEvict(value = CacheNames.STATS, allEntries = true)
    @Transactional
    public MapDto removeImage(String slug) {
        GameMap map = requireMap(slug);
        MapDto before = mapMapper.toDto(map);
        imageStore.remove(map.getImageUrl());
        map.setImageUrl(null);
        MapDto after = mapMapper.toDto(map);
        auditService.logUpdate(AuditEntityType.MAP, slug, before, after);
        return after;
    }

    private GameMap requireMap(String slug) {
        return gameMapRepository.findBySlug(slug)
                .orElseThrow(() -> new EntityNotFoundException("Map", slug));
    }
}
