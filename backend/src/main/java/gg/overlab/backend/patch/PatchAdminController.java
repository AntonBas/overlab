package gg.overlab.backend.patch;

import gg.overlab.backend.patch.dto.PatchDto;
import gg.overlab.backend.patch.dto.PatchRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Patches (admin)")
@RestController
@RequiredArgsConstructor
public class PatchAdminController {

    private final PatchService patchService;

    @Operation(summary = "Create a patch")
    @PostMapping("/api/admin/patches")
    @ResponseStatus(HttpStatus.CREATED)
    public PatchDto create(@Valid @RequestBody PatchRequest request) {
        return patchService.create(request);
    }

    @Operation(summary = "Update a patch")
    @PutMapping("/api/admin/patches/{id}")
    public PatchDto update(@PathVariable Long id, @Valid @RequestBody PatchRequest request) {
        return patchService.update(id, request);
    }

    @Operation(summary = "Delete a patch")
    @DeleteMapping("/api/admin/patches/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        patchService.delete(id);
    }
}
