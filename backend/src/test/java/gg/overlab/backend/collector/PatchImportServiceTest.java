package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.common.SlugService;
import gg.overlab.backend.patch.Patch;
import gg.overlab.backend.patch.PatchRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;

class PatchImportServiceTest {

    private final PatchNotesClient client = mock(PatchNotesClient.class);
    private final PatchRepository patchRepository = mock(PatchRepository.class);

    private PatchImportService service() {
        CollectorProperties properties = new CollectorProperties("https://overwatch.example", "agent",
                Duration.ZERO, null, null, false, false, null, null, 3, null, List.of());
        return new PatchImportService(properties, client, new PatchNotesParser(), patchRepository,
                new SlugService(), mock(ApplicationEventPublisher.class));
    }

    @Test
    void savesNewBalancePatchesWithDateTitleAndLink() {
        when(client.fetch()).thenReturn(PatchNotesParserTest.PAGE);

        int created = service().importNew();

        ArgumentCaptor<Patch> saved = ArgumentCaptor.forClass(Patch.class);
        verify(patchRepository, times(3)).save(saved.capture());
        assertThat(created).isEqualTo(3);
        Patch seasonPatch = saved.getAllValues().get(1);
        assertThat(seasonPatch.getVersion()).isEqualTo("2026-10-06");
        assertThat(seasonPatch.getSlug()).isEqualTo("2026-10-06");
        assertThat(seasonPatch.getTitle()).isEqualTo("Reign of Talon - Season 5: A Grim Doctrine");
        assertThat(seasonPatch.getReleasedAt()).isEqualTo(Instant.parse("2026-10-06T00:00:00Z"));
        assertThat(seasonPatch.getNotes())
                .isEqualTo("https://overwatch.example/en-us/news/patch-notes/#patch-2026-10-06");
    }

    @Test
    void skipsPatchesThatAlreadyExist() {
        when(client.fetch()).thenReturn(PatchNotesParserTest.PAGE);
        when(patchRepository.existsByVersionIgnoreCase("2026-10-13")).thenReturn(true);
        when(patchRepository.existsByVersionIgnoreCase("2026-10-06")).thenReturn(true);

        int created = service().importNew();

        assertThat(created).isEqualTo(1);
        verify(patchRepository, times(1)).save(any(Patch.class));
    }

    @Test
    void savesNothingWhenNoPatchTouchesHeroesOrMaps() {
        when(client.fetch()).thenReturn("""
                <div class="PatchNotes-patch"><div class="PatchNotes-date">October 20, 2026</div>
                <div class="PatchNotes-section-generic_update"><h4 class="PatchNotes-sectionTitle">Bug Fixes</h4></div>
                </div>""");

        assertThat(service().importNew()).isZero();
        verify(patchRepository, never()).save(any(Patch.class));
    }
}
