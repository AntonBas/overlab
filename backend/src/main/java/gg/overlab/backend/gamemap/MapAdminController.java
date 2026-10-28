package gg.overlab.backend.gamemap;

import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.gamemap.dto.MapUpdateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Maps (admin)")
@RestController
@RequestMapping("/api/admin/maps")
@RequiredArgsConstructor
public class MapAdminController {

    private final MapService mapService;

    @Operation(summary = "Update map details")
    @PutMapping("/{slug}")
    public MapDto update(@PathVariable String slug, @Valid @RequestBody MapUpdateRequest request) {
        return mapService.update(slug, request);
    }
}
