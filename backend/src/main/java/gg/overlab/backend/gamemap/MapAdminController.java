package gg.overlab.backend.gamemap;

import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.gamemap.dto.MapUpdateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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

    @Operation(summary = "Upload the map image (PNG, JPEG or WebP, up to 2 MB)")
    @PutMapping(value = "/{slug}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public MapDto uploadImage(@PathVariable String slug, @RequestPart("file") MultipartFile file) {
        return mapService.replaceImage(slug, file);
    }

    @Operation(summary = "Remove the map image")
    @DeleteMapping("/{slug}/image")
    public MapDto removeImage(@PathVariable String slug) {
        return mapService.removeImage(slug);
    }
}
