package gg.overlab.backend.gamemap;

import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.gamemap.dto.MapUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/maps")
@RequiredArgsConstructor
public class MapAdminController {

    private final MapService mapService;

    @PutMapping("/{slug}")
    public MapDto update(@PathVariable String slug, @Valid @RequestBody MapUpdateRequest request) {
        return mapService.update(slug, request);
    }
}
