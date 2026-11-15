package gg.overlab.backend.patch;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.common.SlugService;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.patch.dto.PatchDto;
import gg.overlab.backend.patch.dto.PatchRequest;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class PatchServiceTest {

    private static final Instant RELEASED = Instant.parse("2026-02-10T18:00:00Z");

    private final PatchRepository repository = mock(PatchRepository.class);
    private final AuditService auditService = mock(AuditService.class);
    private final PatchService service = new PatchService(repository, new PatchMapper(), new SlugService(),
            auditService, new PatchSeasonLookup(repository));

    @Test
    void createGeneratesAUniqueSlugFromTheVersion() {
        when(repository.existsByVersionIgnoreCase("26.1")).thenReturn(false);
        when(repository.existsBySlug("26-1")).thenReturn(true);
        when(repository.save(any(Patch.class))).thenAnswer(invocation -> {
            Patch patch = invocation.getArgument(0);
            patch.setId(10L);
            return patch;
        });
        when(repository.findAllByOrderByReleasedAtDesc()).thenReturn(List.of());

        PatchDto created = service.create(new PatchRequest(" 26.1 ", null, "Season 26", RELEASED, "notes"));

        assertThat(created.slug()).isEqualTo("26-1-1");
        assertThat(created.version()).isEqualTo("26.1");
        verify(auditService).logCreate("Patch", 10L, created);
    }

    @Test
    void createRejectsADuplicateVersion() {
        when(repository.existsByVersionIgnoreCase("26.1")).thenReturn(true);

        assertThatThrownBy(() -> service.create(new PatchRequest("26.1", null, null, RELEASED, null)))
                .isInstanceOf(ConflictException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void createRejectsATakenCustomSlug() {
        when(repository.existsBySlug("custom")).thenReturn(true);

        assertThatThrownBy(() -> service.create(new PatchRequest("26.2", "custom", null, RELEASED, null)))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void updateRejectsAVersionUsedByAnotherPatch() {
        when(repository.findById(1L)).thenReturn(Optional.of(patch(1L, "26.1", "26-1")));
        when(repository.existsByVersionIgnoreCaseAndIdNot("26.2", 1L)).thenReturn(true);

        assertThatThrownBy(() -> service.update(1L, new PatchRequest("26.2", null, null, RELEASED, null)))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void updateKeepsTheSlugWhenItIsNotChangedAndAuditsTheChange() {
        Patch patch = patch(1L, "26.1", "26-1");
        when(repository.findById(1L)).thenReturn(Optional.of(patch));
        when(repository.findAllByOrderByReleasedAtDesc()).thenReturn(List.of(patch));

        PatchDto updated = service.update(1L, new PatchRequest("26.1", "26-1", "New title", RELEASED, "notes"));

        assertThat(updated.title()).isEqualTo("New title");
        assertThat(updated.slug()).isEqualTo("26-1");
        verify(repository, never()).existsBySlugAndIdNot(anyString(), any());
        verify(auditService).logUpdate(anyString(), any(), any(PatchDto.class), any(PatchDto.class));
    }

    @Test
    void deleteAuditsAndRemovesThePatch() {
        Patch patch = patch(1L, "26.1", "26-1");
        when(repository.findById(1L)).thenReturn(Optional.of(patch));
        when(repository.findAllByOrderByReleasedAtDesc()).thenReturn(List.of(patch));

        service.delete(1L);

        verify(auditService).logDelete(anyString(), any(), any(PatchDto.class));
        verify(repository).delete(patch);
    }

    @Test
    void unknownPatchIsNotFound() {
        when(repository.findById(9L)).thenReturn(Optional.empty());
        when(repository.findBySlug("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete(9L)).isInstanceOf(EntityNotFoundException.class);
        assertThatThrownBy(() -> service.getBySlug("missing")).isInstanceOf(EntityNotFoundException.class);
    }

    private Patch patch(Long id, String version, String slug) {
        Patch patch = new Patch();
        patch.setId(id);
        patch.setVersion(version);
        patch.setSlug(slug);
        patch.setReleasedAt(RELEASED);
        return patch;
    }
}
