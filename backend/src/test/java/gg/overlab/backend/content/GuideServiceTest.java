package gg.overlab.backend.content;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import gg.overlab.backend.common.SlugService;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.gamemap.GameMap;
import gg.overlab.backend.gamemap.GameMapRepository;
import gg.overlab.backend.guide.Guide;
import gg.overlab.backend.guide.GuideMapper;
import gg.overlab.backend.guide.GuideRepository;
import gg.overlab.backend.guide.GuideService;
import gg.overlab.backend.guide.dto.GuideDto;
import gg.overlab.backend.guide.dto.GuideRequest;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class GuideServiceTest {

    private final GuideRepository guideRepository = mock(GuideRepository.class);
    private final HeroRepository heroRepository = mock(HeroRepository.class);
    private final GameMapRepository mapRepository = mock(GameMapRepository.class);
    private final GuideService service = new GuideService(guideRepository, heroRepository, mapRepository,
            new GuideMapper(), new SlugService());

    private Hero illari;
    private GameMap rialto;

    @BeforeEach
    void setUp() {
        illari = new Hero();
        illari.setId(1L);
        illari.setSlug("illari");
        illari.setName("Illari");
        rialto = new GameMap();
        rialto.setSlug("rialto");
        rialto.setName("Rialto");
        when(heroRepository.findBySlug("illari")).thenReturn(Optional.of(illari));
        when(mapRepository.findBySlug("rialto")).thenReturn(Optional.of(rialto));
        when(guideRepository.save(any(Guide.class))).thenAnswer(invocation -> {
            Guide guide = invocation.getArgument(0);
            guide.setId(42L);
            return guide;
        });
    }

    @Test
    void generatesSlugFromTitleAndBuildsEmbedUrl() {
        GuideDto dto = service.create(request(null, "Illari pylons on Rialto", true));

        assertThat(dto.slug()).isEqualTo("illari-pylons-on-rialto");
        assertThat(dto.path()).isEqualTo("42-illari-pylons-on-rialto");
        assertThat(dto.embedUrl()).isEqualTo("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=83");
        assertThat(dto.mapSlug()).isEqualTo("rialto");
        assertThat(dto.published()).isTrue();
    }

    @Test
    void addsSuffixWhenGeneratedSlugIsTaken() {
        when(guideRepository.existsBySlug("illari-pylons-on-rialto")).thenReturn(true);

        GuideDto dto = service.create(request(null, "Illari pylons on Rialto", false));

        assertThat(dto.slug()).isEqualTo("illari-pylons-on-rialto-1");
        assertThat(dto.published()).isFalse();
    }

    @Test
    void rejectsExplicitSlugThatIsAlreadyUsed() {
        when(guideRepository.existsBySlug("custom-slug")).thenReturn(true);

        assertThatThrownBy(() -> service.create(request("custom-slug", "Title", true)))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void rejectsUnknownHeroAndUnknownMap() {
        when(heroRepository.findBySlug("nobody")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(new GuideRequest("nobody", null, "Title", null, "dQw4w9WgXcQ", 0,
                null, 0, true))).isInstanceOf(EntityNotFoundException.class);

        when(mapRepository.findBySlug("nowhere")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.create(new GuideRequest("illari", "nowhere", "Title", null, "dQw4w9WgXcQ", 0,
                null, 0, true))).isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void publicLookupFindsGuideByIdEvenWhenSlugChanged() {
        when(guideRepository.findWithDetailsById(42L)).thenReturn(Optional.of(guide(true)));

        GuideDto dto = service.getPublishedByPath("42-old-title");

        assertThat(dto.id()).isEqualTo(42L);
        assertThat(dto.slug()).isEqualTo("current-slug");
    }

    @Test
    void publicLookupHidesUnpublishedGuides() {
        when(guideRepository.findWithDetailsById(42L)).thenReturn(Optional.of(guide(false)));

        assertThatThrownBy(() -> service.getPublishedByPath("42-current-slug"))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void publicLookupRejectsPathWithoutId() {
        assertThatThrownBy(() -> service.getPublishedByPath("no-id-here")).isInstanceOf(EntityNotFoundException.class);
    }

    private GuideRequest request(String slug, String title, boolean published) {
        return new GuideRequest("illari", "rialto", title, slug, "dQw4w9WgXcQ", 83, "Description", 1, published);
    }

    private Guide guide(boolean published) {
        Guide guide = new Guide();
        guide.setId(42L);
        guide.setSlug("current-slug");
        guide.setHero(illari);
        guide.setTitle("Title");
        guide.setYoutubeId("dQw4w9WgXcQ");
        guide.setPublished(published);
        return guide;
    }
}
