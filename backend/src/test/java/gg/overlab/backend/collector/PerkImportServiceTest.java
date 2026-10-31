package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.cache.CacheManager;

class PerkImportServiceTest {

    private final HeroRepository heroRepository = mock(HeroRepository.class);
    private final BlizzardHeroPageClient pageClient = mock(BlizzardHeroPageClient.class);
    private final HeroPerkParser parser = new HeroPerkParser();
    private final PerkImportWriter writer = mock(PerkImportWriter.class);
    private final AbilityImportWriter abilityWriter = mock(AbilityImportWriter.class);

    @BeforeEach
    void setUp() {
        when(abilityWriter.write(any(), any(), any())).thenReturn(new PerkImportWriter.Counts(0, 0));
        when(heroRepository.findAll()).thenReturn(List.of(hero("ana", true), hero("hidden", false), hero("dva", true)));
    }

    private PerkImportService service(boolean enabled) {
        CollectorProperties properties = new CollectorProperties("https://overwatch.example", "agent",
                Duration.ZERO, null, null, false, enabled, null, null, 3, null, List.of());
        return new PerkImportService(properties, heroRepository, pageClient, parser, new HeroAbilityParser(),
                mock(ImageDownloader.class), writer, abilityWriter, mock(CacheManager.class), Runnable::run);
    }

    private Hero hero(String slug, boolean active) {
        Hero hero = new Hero();
        hero.setSlug(slug);
        hero.setActive(active);
        return hero;
    }

    @Test
    void refusesToRunWhileDisabled() {
        assertThatThrownBy(() -> service(false).startAsync()).isInstanceOf(BadRequestException.class);

        verify(pageClient, never()).fetch(any());
    }

    @Test
    void importsEveryActiveHeroAndSkipsHiddenOnes() {
        when(pageClient.fetch(any())).thenReturn(Optional.of(HeroPerkParserTest.PAGE));
        when(writer.write(any(), any(), any())).thenReturn(new PerkImportWriter.Counts(3, 0));

        int heroes = service(true).startAsync();

        assertThat(heroes).isEqualTo(2);
        verify(writer).write(eq("ana"), any(), any());
        verify(writer).write(eq("dva"), any(), any());
        verify(writer, never()).write(eq("hidden"), any(), any());
    }

    @Test
    void aFailingHeroDoesNotStopTheOthers() {
        when(pageClient.fetch("ana")).thenThrow(new IllegalStateException("boom"));
        when(pageClient.fetch("dva")).thenReturn(Optional.of(HeroPerkParserTest.PAGE));
        when(writer.write(any(), any(), any())).thenReturn(new PerkImportWriter.Counts(1, 0));

        service(true).startAsync();

        verify(writer).write(eq("dva"), any(), any());
    }

    @Test
    void heroWithoutAPageIsSkipped() {
        when(pageClient.fetch(any())).thenReturn(Optional.empty());

        service(true).startAsync();

        verify(writer, never()).write(any(), any(), any());
    }
}
