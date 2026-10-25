package gg.overlab.backend.hero;

import gg.overlab.backend.hero.dto.HeroDto;
import gg.overlab.backend.hero.dto.HeroUpdateRequest;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/heroes")
@RequiredArgsConstructor
public class HeroAdminController {

    private final HeroService heroService;

    @GetMapping
    public List<HeroDto> findAll() {
        return heroService.findAllForAdmin();
    }

    @PutMapping("/{slug}")
    public HeroDto update(@PathVariable String slug, @Valid @RequestBody HeroUpdateRequest request) {
        return heroService.update(slug, request);
    }
}
