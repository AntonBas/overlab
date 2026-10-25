package gg.overlab.backend.gamemap;

import gg.overlab.backend.gamemap.dto.MapDto;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/maps")
@RequiredArgsConstructor
public class MapController {

    private final MapService mapService;

    @GetMapping
    public List<MapDto> findAll() {
        return mapService.findAll();
    }

    @GetMapping("/{slug}")
    public MapDto getBySlug(@PathVariable String slug) {
        return mapService.getBySlug(slug);
    }
}
