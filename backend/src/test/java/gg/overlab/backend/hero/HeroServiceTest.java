package gg.overlab.backend.hero;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.audit.AuditEntityType;
import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.dto.HeroAdminDto;
import gg.overlab.backend.hero.dto.HeroDto;
import gg.overlab.backend.hero.dto.HeroUpdateRequest;
import gg.overlab.backend.media.MediaProperties;
import gg.overlab.backend.media.MediaUrlResolver;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Sort;

class HeroServiceTest {

    private final HeroRepository heroRepository = mock(HeroRepository.class);
    private final AuditService auditService = mock(AuditService.class);
    private final HeroMapper heroMapper = new HeroMapper(new MediaUrlResolver(new MediaProperties(Path.of("media"),
            "/media")));
    private final HeroService service = new HeroService(heroRepository, heroMapper, auditService);

    private Hero hero(String slug, String name, boolean active) {
        Hero hero = new Hero();
        hero.setSlug(slug);
        hero.setName(name);
        hero.setRole(HeroRole.SUPPORT);
        hero.setPortraitUrl("heroes/" + slug + ".webp");
        hero.setActive(active);
        return hero;
    }

    @Test
    void listsActiveHeroesWithResolvedPortraitUrls() {
        when(heroRepository.findAllByActiveTrueOrderByNameAsc()).thenReturn(List.of(hero("ana", "Ana", true)));

        List<HeroDto> heroes = service.findAll();

        assertThat(heroes).singleElement().satisfies(dto -> {
            assertThat(dto.slug()).isEqualTo("ana");
            assertThat(dto.portraitUrl()).isEqualTo("/media/heroes/ana.webp");
        });
    }

    @Test
    void returnsOneHeroOrFailsWhenTheSlugIsUnknown() {
        when(heroRepository.findBySlug("ana")).thenReturn(Optional.of(hero("ana", "Ana", true)));
        when(heroRepository.findBySlug("nobody")).thenReturn(Optional.empty());

        assertThat(service.getBySlug("ana").name()).isEqualTo("Ana");
        assertThatThrownBy(() -> service.getBySlug("nobody")).isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void adminListIncludesInactiveHeroesSortedByName() {
        when(heroRepository.findAll(any(Sort.class))).thenReturn(List.of(hero("old", "Old", false)));

        List<HeroAdminDto> heroes = service.findAllForAdmin();

        assertThat(heroes).singleElement().satisfies(dto -> assertThat(dto.active()).isFalse());
        verify(heroRepository).findAll(Sort.by("name"));
    }

    @Test
    void updateChangesTheEditableFieldsAndAuditsTheDifference() {
        Hero ana = hero("ana", "Ana", true);
        when(heroRepository.findBySlug("ana")).thenReturn(Optional.of(ana));

        HeroAdminDto updated = service.update("ana", new HeroUpdateRequest("Healer", "Range", "Slow", false));

        assertThat(updated.description()).isEqualTo("Healer");
        assertThat(updated.active()).isFalse();
        assertThat(ana.getStrengths()).isEqualTo("Range");
        assertThat(ana.getWeaknesses()).isEqualTo("Slow");
        verify(auditService).logUpdate(eq(AuditEntityType.HERO), eq("ana"), any(HeroAdminDto.class),
                eq(updated));
    }

    @Test
    void updatingAnUnknownHeroFails() {
        when(heroRepository.findBySlug("nobody")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update("nobody", new HeroUpdateRequest(null, null, null, true)))
                .isInstanceOf(EntityNotFoundException.class);
    }
}
