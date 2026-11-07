package gg.overlab.backend.user.personal;

import gg.overlab.backend.config.security.AuthenticatedUser;
import gg.overlab.backend.user.personal.dto.FavoritesDto;
import gg.overlab.backend.user.personal.dto.PreferencesDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Personal library")
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class PersonalController {

    private final PersonalService personalService;

    @Operation(summary = "Get favorite heroes and maps")
    @GetMapping("/favorites")
    public FavoritesDto favorites(@AuthenticationPrincipal AuthenticatedUser user) {
        return personalService.favorites(user.id());
    }

    @Operation(summary = "Add a hero to favorites")
    @PutMapping("/favorites/heroes/{slug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addHeroFavorite(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable String slug) {
        personalService.addHeroFavorite(user.id(), slug);
    }

    @Operation(summary = "Remove a hero from favorites")
    @DeleteMapping("/favorites/heroes/{slug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeHeroFavorite(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable String slug) {
        personalService.removeHeroFavorite(user.id(), slug);
    }

    @Operation(summary = "Add a map to favorites")
    @PutMapping("/favorites/maps/{slug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addMapFavorite(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable String slug) {
        personalService.addMapFavorite(user.id(), slug);
    }

    @Operation(summary = "Remove a map from favorites")
    @DeleteMapping("/favorites/maps/{slug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMapFavorite(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable String slug) {
        personalService.removeMapFavorite(user.id(), slug);
    }

    @Operation(summary = "Get default statistics filters")
    @GetMapping("/preferences")
    public PreferencesDto preferences(@AuthenticationPrincipal AuthenticatedUser user) {
        return personalService.preferences(user.id());
    }

    @Operation(summary = "Save default statistics filters")
    @PutMapping("/preferences")
    public PreferencesDto savePreferences(@AuthenticationPrincipal AuthenticatedUser user,
                                          @RequestBody PreferencesDto request) {
        return personalService.savePreferences(user.id(), request);
    }
}
