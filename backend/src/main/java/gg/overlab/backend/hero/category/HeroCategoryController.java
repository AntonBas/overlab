package gg.overlab.backend.hero.category;

import gg.overlab.backend.hero.category.dto.HeroCategoriesDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Hero categories")
@RestController
@RequiredArgsConstructor
public class HeroCategoryController {

    private final HeroCategoryService categoryService;

    @Operation(summary = "Hero categories with their members and curated hero-versus-category matchups")
    @GetMapping("/api/hero-categories")
    public HeroCategoriesDto findAll() {
        return categoryService.findAll();
    }
}
