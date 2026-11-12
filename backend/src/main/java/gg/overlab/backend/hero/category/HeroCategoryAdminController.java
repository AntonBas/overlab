package gg.overlab.backend.hero.category;

import gg.overlab.backend.hero.category.dto.CategoryAdminDto;
import gg.overlab.backend.hero.category.dto.CategoryMatchupAdminDto;
import gg.overlab.backend.hero.category.dto.CategoryMatchupRequest;
import gg.overlab.backend.hero.category.dto.CategoryRequest;
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

@Tag(name = "Hero categories (admin)")
@RestController
@RequiredArgsConstructor
public class HeroCategoryAdminController {

    private final HeroCategoryService categoryService;

    @Operation(summary = "List hero categories with member slugs")
    @GetMapping("/api/admin/hero-categories")
    public List<CategoryAdminDto> findCategoriesForAdmin() {
        return categoryService.findCategoriesForAdmin();
    }

    @Operation(summary = "Create a hero category")
    @PostMapping("/api/admin/hero-categories")
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryAdminDto createCategory(@Valid @RequestBody CategoryRequest request) {
        return categoryService.createCategory(request);
    }

    @Operation(summary = "Update a hero category and its members")
    @PutMapping("/api/admin/hero-categories/{id}")
    public CategoryAdminDto updateCategory(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        return categoryService.updateCategory(id, request);
    }

    @Operation(summary = "Delete a hero category")
    @DeleteMapping("/api/admin/hero-categories/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
    }

    @Operation(summary = "List hero-versus-category matchups")
    @GetMapping("/api/admin/hero-category-relations")
    public List<CategoryMatchupAdminDto> findMatchupsForAdmin() {
        return categoryService.findMatchupsForAdmin();
    }

    @Operation(summary = "Create a hero-versus-category matchup")
    @PostMapping("/api/admin/hero-category-relations")
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryMatchupAdminDto createMatchup(@Valid @RequestBody CategoryMatchupRequest request) {
        return categoryService.createMatchup(request);
    }

    @Operation(summary = "Update a hero-versus-category matchup")
    @PutMapping("/api/admin/hero-category-relations/{id}")
    public CategoryMatchupAdminDto updateMatchup(@PathVariable Long id,
                                                 @Valid @RequestBody CategoryMatchupRequest request) {
        return categoryService.updateMatchup(id, request);
    }

    @Operation(summary = "Delete a hero-versus-category matchup")
    @DeleteMapping("/api/admin/hero-category-relations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMatchup(@PathVariable Long id) {
        categoryService.deleteMatchup(id);
    }
}
