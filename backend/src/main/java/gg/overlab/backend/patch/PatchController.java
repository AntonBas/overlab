package gg.overlab.backend.patch;

import gg.overlab.backend.patch.dto.PatchDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Patches")
@RestController
@RequiredArgsConstructor
public class PatchController {

    private final PatchService patchService;

    @Operation(summary = "List patches, newest first")
    @GetMapping("/api/patches")
    public List<PatchDto> findAll() {
        return patchService.findAll();
    }

    @Operation(summary = "Get the patch that was active at a given moment")
    @GetMapping("/api/patches/at")
    public PatchDto findActiveAt(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant date) {
        return patchService.findActiveAt(date);
    }

    @Operation(summary = "Get a patch by slug")
    @GetMapping("/api/patches/{slug}")
    public PatchDto getBySlug(@PathVariable String slug) {
        return patchService.getBySlug(slug);
    }
}
