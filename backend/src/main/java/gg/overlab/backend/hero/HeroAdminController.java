package gg.overlab.backend.hero;

import gg.overlab.backend.hero.dto.HeroAdminDto;
import gg.overlab.backend.hero.dto.HeroUpdateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Heroes (admin)")
@RestController
@RequestMapping("/api/admin/heroes")
@RequiredArgsConstructor
public class HeroAdminController {

    private final HeroService heroService;

    @Operation(summary = "List heroes with admin fields")
    @GetMapping
    public List<HeroAdminDto> findAll() {
        return heroService.findAllForAdmin();
    }

    @Operation(summary = "Update hero details")
    @PutMapping("/{slug}")
    public HeroAdminDto update(@PathVariable String slug, @Valid @RequestBody HeroUpdateRequest request) {
        return heroService.update(slug, request);
    }
}
