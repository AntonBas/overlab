package gg.overlab.backend.hero.ability;

import gg.overlab.backend.hero.ability.dto.AbilityAdminDto;
import gg.overlab.backend.hero.ability.dto.AbilityControlRequest;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Abilities (admin)")
@RestController
@RequestMapping("/api/admin/abilities")
@RequiredArgsConstructor
public class AbilityAdminController {

    private final AbilityService abilityService;

    @Operation(summary = "List abilities of a hero with their control slot")
    @GetMapping
    public List<AbilityAdminDto> findByHero(@RequestParam String hero) {
        return abilityService.findForAdmin(hero);
    }

    @Operation(summary = "Set the control slot of an ability (empty clears it)")
    @PutMapping("/{id}/control")
    public AbilityAdminDto updateControl(@PathVariable Long id, @Valid @RequestBody AbilityControlRequest request) {
        return abilityService.updateControl(id, request);
    }
}
