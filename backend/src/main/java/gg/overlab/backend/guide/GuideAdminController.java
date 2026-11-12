package gg.overlab.backend.guide;

import gg.overlab.backend.guide.dto.GuideDto;
import gg.overlab.backend.guide.dto.GuideRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Guides (admin)")
@RestController
@RequiredArgsConstructor
public class GuideAdminController {

    private final GuideService guideService;

    @Operation(summary = "List all guides including drafts")
    @GetMapping("/api/admin/guides")
    public List<GuideDto> findAllForAdmin() {
        return guideService.findAllForAdmin();
    }

    @Operation(summary = "Create a guide")
    @PostMapping("/api/admin/guides")
    @ResponseStatus(HttpStatus.CREATED)
    public GuideDto create(@Valid @RequestBody GuideRequest request) {
        return guideService.create(request);
    }

    @Operation(summary = "Update a guide")
    @PutMapping("/api/admin/guides/{id}")
    public GuideDto update(@PathVariable Long id, @Valid @RequestBody GuideRequest request) {
        return guideService.update(id, request);
    }

    @Operation(summary = "Delete a guide")
    @DeleteMapping("/api/admin/guides/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        guideService.delete(id);
    }
}
