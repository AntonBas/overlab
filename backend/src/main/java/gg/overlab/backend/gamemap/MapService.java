package gg.overlab.backend.gamemap;

import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.config.cache.EvictContentCaches;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.gamemap.dto.MapUpdateRequest;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class MapService {

    public static final String CACHE_NAME = "maps";

    private final GameMapRepository gameMapRepository;
    private final MapMapper mapMapper;
    private final AuditService auditService;

    @Cacheable(value = CACHE_NAME, key = "'all'")
    @Transactional(readOnly = true)
    public List<MapDto> findAll() {
        return gameMapRepository.findAllByOrderByNameAsc().stream()
                .map(mapMapper::toDto)
                .toList();
    }

    @Cacheable(value = CACHE_NAME, key = "#slug")
    @Transactional(readOnly = true)
    public MapDto getBySlug(String slug) {
        GameMap map = gameMapRepository.findBySlug(slug)
                .orElseThrow(() -> new EntityNotFoundException("Map", slug));
        return mapMapper.toDto(map);
    }

    @EvictContentCaches
    @Transactional
    public MapDto update(String slug, MapUpdateRequest request) {
        GameMap map = gameMapRepository.findBySlug(slug)
                .orElseThrow(() -> new EntityNotFoundException("Map", slug));
        MapDto before = mapMapper.toDto(map);
        map.setMode(request.mode());
        map.setImageUrl(request.imageUrl());
        MapDto after = mapMapper.toDto(map);
        auditService.logUpdate("Map", slug, before, after);
        return after;
    }
}
