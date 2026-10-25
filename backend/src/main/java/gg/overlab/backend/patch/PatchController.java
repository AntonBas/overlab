package gg.overlab.backend.patch;

import gg.overlab.backend.patch.dto.PatchDto;
import gg.overlab.backend.patch.dto.PatchRequest;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class PatchController {

    private final PatchService patchService;

    @GetMapping("/api/patches")
    public List<PatchDto> findAll() {
        return patchService.findAll();
    }

    @GetMapping("/api/patches/at")
    public PatchDto findActiveAt(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant date) {
        return patchService.findActiveAt(date);
    }

    @GetMapping("/api/patches/{slug}")
    public PatchDto getBySlug(@PathVariable String slug) {
        return patchService.getBySlug(slug);
    }

    @PostMapping("/api/admin/patches")
    @ResponseStatus(HttpStatus.CREATED)
    public PatchDto create(@Valid @RequestBody PatchRequest request) {
        return patchService.create(request);
    }

    @PutMapping("/api/admin/patches/{id}")
    public PatchDto update(@PathVariable Long id, @Valid @RequestBody PatchRequest request) {
        return patchService.update(id, request);
    }

    @DeleteMapping("/api/admin/patches/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        patchService.delete(id);
    }
}
