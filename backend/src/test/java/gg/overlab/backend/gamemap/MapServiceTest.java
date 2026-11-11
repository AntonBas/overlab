package gg.overlab.backend.gamemap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.gamemap.dto.MapDto;
import gg.overlab.backend.gamemap.dto.MapUpdateRequest;
import gg.overlab.backend.media.ImageStore;
import gg.overlab.backend.media.MediaFolder;
import gg.overlab.backend.media.MediaProperties;
import gg.overlab.backend.media.MediaUrlResolver;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.web.multipart.MultipartFile;

class MapServiceTest {

    private final GameMapRepository repository = mock(GameMapRepository.class);
    private final AuditService auditService = mock(AuditService.class);
    private final ImageStore imageStore = mock(ImageStore.class);
    private final MapService service = new MapService(repository,
            new MapMapper(new MediaUrlResolver(new MediaProperties(Path.of("media"), "/media"))), auditService,
            imageStore);

    @Test
    void listsMapsInRepositoryOrder() {
        when(repository.findAllByOrderByNameAsc()).thenReturn(List.of(map("busan", null), map("ilios", null)));

        assertThat(service.findAll()).extracting(MapDto::slug).containsExactly("busan", "ilios");
    }

    @Test
    void unknownSlugIsNotFound() {
        when(repository.findBySlug("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getBySlug("missing")).isInstanceOf(EntityNotFoundException.class);
        assertThatThrownBy(() -> service.update("missing", new MapUpdateRequest(MapMode.PUSH)))
                .isInstanceOf(EntityNotFoundException.class);
        assertThatThrownBy(() -> service.removeImage("missing")).isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void updateChangesTheModeAndWritesAnAuditEntry() {
        GameMap map = map("busan", null);
        when(repository.findBySlug("busan")).thenReturn(Optional.of(map));

        MapDto updated = service.update("busan", new MapUpdateRequest(MapMode.PUSH));

        assertThat(updated.mode()).isEqualTo(MapMode.PUSH);
        verify(auditService).logUpdate(eq("Map"), eq("busan"), any(MapDto.class), eq(updated));
    }

    @Test
    void replacingTheImageStoresTheNewFileAndKeepsTheOldPathForCleanup() {
        GameMap map = map("busan", "maps/old.png");
        MultipartFile file = mock(MultipartFile.class);
        when(repository.findBySlug("busan")).thenReturn(Optional.of(map));
        when(imageStore.replace(MediaFolder.MAPS, "busan", "maps/old.png", file)).thenReturn("maps/new.png");

        MapDto updated = service.replaceImage("busan", file);

        assertThat(updated.imageUrl()).isEqualTo("/media/maps/new.png");
        assertThat(map.getImageUrl()).isEqualTo("maps/new.png");
    }

    @Test
    void removingTheImageDeletesTheFileAndClearsTheReference() {
        GameMap map = map("busan", "maps/old.png");
        when(repository.findBySlug("busan")).thenReturn(Optional.of(map));

        MapDto updated = service.removeImage("busan");

        verify(imageStore).remove("maps/old.png");
        assertThat(updated.imageUrl()).isNull();
        assertThat(map.getImageUrl()).isNull();
    }

    private GameMap map(String slug, String imageUrl) {
        GameMap map = new GameMap();
        map.setSlug(slug);
        map.setName(slug);
        map.setImageUrl(imageUrl);
        return map;
    }
}
