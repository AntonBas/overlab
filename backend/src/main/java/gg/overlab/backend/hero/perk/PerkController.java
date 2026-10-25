package gg.overlab.backend.hero.perk;

import gg.overlab.backend.hero.perk.dto.PerkDto;
import gg.overlab.backend.hero.perk.dto.PerkRequest;
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

@RestController
@RequiredArgsConstructor
public class PerkController {

    private final PerkService perkService;

    @GetMapping("/api/heroes/{slug}/perks")
    public List<PerkDto> findByHero(@PathVariable String slug) {
        return perkService.findByHero(slug);
    }

    @PostMapping("/api/admin/perks")
    @ResponseStatus(HttpStatus.CREATED)
    public PerkDto create(@Valid @RequestBody PerkRequest request) {
        return perkService.create(request);
    }

    @PutMapping("/api/admin/perks/{id}")
    public PerkDto update(@PathVariable Long id, @Valid @RequestBody PerkRequest request) {
        return perkService.update(id, request);
    }

    @DeleteMapping("/api/admin/perks/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        perkService.delete(id);
    }
}
