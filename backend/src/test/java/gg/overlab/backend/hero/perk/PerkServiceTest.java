package gg.overlab.backend.hero.perk;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.audit.AuditEntityType;
import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.perk.dto.PerkDto;
import gg.overlab.backend.hero.perk.dto.PerkRequest;
import gg.overlab.backend.media.ImageStore;
import gg.overlab.backend.media.MediaFolder;
import gg.overlab.backend.media.MediaProperties;
import gg.overlab.backend.media.MediaUrlResolver;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

class PerkServiceTest {

    private final PerkRepository perkRepository = mock(PerkRepository.class);
    private final HeroRepository heroRepository = mock(HeroRepository.class);
    private final AuditService auditService = mock(AuditService.class);
    private final ImageStore imageStore = mock(ImageStore.class);
    private final PerkService service = new PerkService(perkRepository, heroRepository,
            new PerkMapper(new MediaUrlResolver(new MediaProperties(Path.of("media"), "/media"))), auditService,
            imageStore);

    private Hero ana;

    @BeforeEach
    void setUp() {
        ana = new Hero();
        ana.setSlug("ana");
        ana.setName("Ana");
        when(heroRepository.findBySlug("ana")).thenReturn(Optional.of(ana));
        when(heroRepository.findBySlugAndActiveTrue("ana")).thenReturn(Optional.of(ana));
        when(perkRepository.save(any(Perk.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private PerkRequest request(PerkSlot slot, PerkPosition position) {
        return new PerkRequest("ana", " Quick Dart ", "Fires faster", slot, position, PerkRecommendation.OPTIONAL,
                null);
    }

    private Perk perk(String iconUrl) {
        Perk perk = new Perk();
        perk.setHero(ana);
        perk.setName("Quick Dart");
        perk.setSlot(PerkSlot.MINOR);
        perk.setPosition(PerkPosition.LEFT);
        perk.setRecommendation(PerkRecommendation.OPTIONAL);
        perk.setIconUrl(iconUrl);
        return perk;
    }

    @Test
    void createsAPerkAndAuditsIt() {
        PerkDto created = service.create(request(PerkSlot.MINOR, PerkPosition.LEFT));

        assertThat(created.name()).isEqualTo("Quick Dart");
        assertThat(created.heroSlug()).isEqualTo("ana");
        verify(auditService).logCreate(eq(AuditEntityType.PERK), any(), eq(created));
    }

    @Test
    void createRejectsADuplicateNameAndATakenPosition() {
        when(perkRepository.existsByHeroIdAndNameIgnoreCase(any(), eq("Quick Dart"))).thenReturn(true);
        assertThatThrownBy(() -> service.create(request(PerkSlot.MINOR, PerkPosition.LEFT)))
                .isInstanceOf(ConflictException.class).hasMessageContaining("already exists");

        when(perkRepository.existsByHeroIdAndNameIgnoreCase(any(), any())).thenReturn(false);
        when(perkRepository.existsByHeroIdAndSlotAndPosition(any(), eq(PerkSlot.MAJOR), eq(PerkPosition.RIGHT)))
                .thenReturn(true);
        assertThatThrownBy(() -> service.create(request(PerkSlot.MAJOR, PerkPosition.RIGHT)))
                .isInstanceOf(ConflictException.class).hasMessageContaining("major perk on the right");
        verify(perkRepository, never()).save(any());
    }

    @Test
    void updateChangesThePerkAndRejectsConflicts() {
        Perk existing = perk(null);
        when(perkRepository.findById(4L)).thenReturn(Optional.of(existing));

        PerkDto updated = service.update(4L, request(PerkSlot.MAJOR, PerkPosition.RIGHT));

        assertThat(updated.slot()).isEqualTo(PerkSlot.MAJOR);
        assertThat(existing.getPosition()).isEqualTo(PerkPosition.RIGHT);
        verify(auditService).logUpdate(eq(AuditEntityType.PERK), eq(4L), any(PerkDto.class), eq(updated));

        when(perkRepository.existsByHeroIdAndNameIgnoreCaseAndIdNot(any(), any(), eq(4L))).thenReturn(true);
        assertThatThrownBy(() -> service.update(4L, request(PerkSlot.MINOR, PerkPosition.LEFT)))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void updatingAnUnknownPerkFails() {
        when(perkRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(9L, request(PerkSlot.MINOR, PerkPosition.LEFT)))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void deleteRemovesThePerkAndItsIcon() {
        Perk existing = perk("perks/perk-4.png");
        when(perkRepository.findById(4L)).thenReturn(Optional.of(existing));

        service.delete(4L);

        verify(perkRepository).delete(existing);
        verify(imageStore).remove("perks/perk-4.png");
        verify(auditService).logDelete(eq(AuditEntityType.PERK), eq(4L), any(PerkDto.class));
    }

    @Test
    void replacingTheIconStoresTheFileAndUpdatesThePath() {
        Perk existing = perk("perks/old.png");
        when(perkRepository.findById(4L)).thenReturn(Optional.of(existing));
        MockMultipartFile file = new MockMultipartFile("file", "icon.png", "image/png", new byte[] {1});
        when(imageStore.replace(MediaFolder.PERKS, "perk-4", "perks/old.png", file)).thenReturn("perks/perk-4-abc.png");

        PerkDto updated = service.replaceIcon(4L, file);

        assertThat(updated.iconUrl()).isEqualTo("/media/perks/perk-4-abc.png");
        verify(auditService).logUpdate(eq(AuditEntityType.PERK), eq(4L), any(PerkDto.class), eq(updated));
    }

    @Test
    void removingTheIconClearsThePath() {
        Perk existing = perk("perks/perk-4.png");
        when(perkRepository.findById(4L)).thenReturn(Optional.of(existing));

        PerkDto updated = service.removeIcon(4L);

        assertThat(updated.iconUrl()).isNull();
        verify(imageStore).remove("perks/perk-4.png");
    }

    @Test
    void listsPerksOfAnExistingHeroOnly() {
        when(perkRepository.findAllByHeroSlugOrderBySlotAscPositionAscNameAsc("ana")).thenReturn(List.of(perk(null)));
        when(heroRepository.findBySlug("nobody")).thenReturn(Optional.empty());

        assertThat(service.findByHero("ana")).hasSize(1);
        assertThatThrownBy(() -> service.findByHero("nobody")).isInstanceOf(EntityNotFoundException.class);
    }
}
