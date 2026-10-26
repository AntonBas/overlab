package gg.overlab.backend.user.personal;

import gg.overlab.backend.config.security.AuthenticatedUser;
import gg.overlab.backend.user.personal.dto.FavoritesDto;
import gg.overlab.backend.user.personal.dto.NoteDto;
import gg.overlab.backend.user.personal.dto.NoteRequest;
import gg.overlab.backend.user.personal.dto.PreferencesDto;
import jakarta.validation.Valid;
import java.util.List;
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

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class PersonalController {

    private final PersonalService personalService;

    @GetMapping("/favorites")
    public FavoritesDto favorites(@AuthenticationPrincipal AuthenticatedUser user) {
        return personalService.favorites(user.id());
    }

    @PutMapping("/favorites/heroes/{slug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addHeroFavorite(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable String slug) {
        personalService.addHeroFavorite(user.id(), slug);
    }

    @DeleteMapping("/favorites/heroes/{slug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeHeroFavorite(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable String slug) {
        personalService.removeHeroFavorite(user.id(), slug);
    }

    @PutMapping("/favorites/maps/{slug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addMapFavorite(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable String slug) {
        personalService.addMapFavorite(user.id(), slug);
    }

    @DeleteMapping("/favorites/maps/{slug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMapFavorite(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable String slug) {
        personalService.removeMapFavorite(user.id(), slug);
    }

    @GetMapping("/notes")
    public List<NoteDto> notes(@AuthenticationPrincipal AuthenticatedUser user) {
        return personalService.notes(user.id());
    }

    @GetMapping("/notes/{heroSlug}")
    public NoteDto note(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable String heroSlug) {
        return personalService.note(user.id(), heroSlug);
    }

    @PutMapping("/notes/{heroSlug}")
    public NoteDto saveNote(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable String heroSlug,
                            @Valid @RequestBody NoteRequest request) {
        return personalService.saveNote(user.id(), heroSlug, request.content());
    }

    @DeleteMapping("/notes/{heroSlug}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNote(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable String heroSlug) {
        personalService.deleteNote(user.id(), heroSlug);
    }

    @GetMapping("/preferences")
    public PreferencesDto preferences(@AuthenticationPrincipal AuthenticatedUser user) {
        return personalService.preferences(user.id());
    }

    @PutMapping("/preferences")
    public PreferencesDto savePreferences(@AuthenticationPrincipal AuthenticatedUser user,
                                          @RequestBody PreferencesDto request) {
        return personalService.savePreferences(user.id(), request);
    }
}
