package gg.overlab.backend.hero.perk;

import gg.overlab.backend.hero.perk.dto.PerkDto;
import gg.overlab.backend.hero.perk.dto.PerkRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Tag(name = "Perks (admin)")
@RestController
@RequiredArgsConstructor
public class PerkAdminController {

    private final PerkService perkService;

    @Operation(summary = "Create a perk")
    @PostMapping("/api/admin/perks")
    @ResponseStatus(HttpStatus.CREATED)
    public PerkDto create(@Valid @RequestBody PerkRequest request) {
        return perkService.create(request);
    }

    @Operation(summary = "Update a perk")
    @PutMapping("/api/admin/perks/{id}")
    public PerkDto update(@PathVariable Long id, @Valid @RequestBody PerkRequest request) {
        return perkService.update(id, request);
    }

    @Operation(summary = "Delete a perk")
    @DeleteMapping("/api/admin/perks/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        perkService.delete(id);
    }

    @Operation(summary = "Upload the perk icon (PNG, JPEG or WebP, up to 2 MB)")
    @PutMapping(value = "/api/admin/perks/{id}/icon", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PerkDto uploadIcon(@PathVariable Long id, @RequestPart("file") MultipartFile file) {
        return perkService.replaceIcon(id, file);
    }

    @Operation(summary = "Remove the perk icon")
    @DeleteMapping("/api/admin/perks/{id}/icon")
    public PerkDto removeIcon(@PathVariable Long id) {
        return perkService.removeIcon(id);
    }
}
