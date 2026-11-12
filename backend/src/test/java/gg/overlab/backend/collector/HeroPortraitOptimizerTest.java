package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.config.cache.CacheEviction;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.media.MediaFolder;
import gg.overlab.backend.media.MediaProperties;
import gg.overlab.backend.media.MediaStorage;
import gg.overlab.backend.media.WebpConverter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class HeroPortraitOptimizerTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 1, 2, 3, 4};
    private static final byte[] WEBP = {'W', 'E', 'B', 'P'};

    @TempDir
    Path directory;

    private final HeroRepository heroRepository = mock(HeroRepository.class);
    private final WebpConverter webpConverter = mock(WebpConverter.class);
    private final CacheEviction cacheEviction = mock(CacheEviction.class);

    private HeroPortraitOptimizer optimizer(MediaStorage storage) {
        return new HeroPortraitOptimizer(heroRepository, storage, webpConverter, cacheEviction);
    }

    private MediaStorage storage() {
        return new MediaStorage(new MediaProperties(directory, "/media"));
    }

    private Hero hero(String slug, String portraitUrl) {
        Hero hero = new Hero();
        hero.setSlug(slug);
        hero.setPortraitUrl(portraitUrl);
        return hero;
    }

    @Test
    void convertsStoredPngPortraitsAndRemovesTheOriginals() {
        MediaStorage storage = storage();
        storage.save(MediaFolder.HEROES, "ana.png", PNG);
        Hero hero = hero("ana", "heroes/ana.png");
        when(heroRepository.findAll()).thenReturn(List.of(hero));
        when(webpConverter.isAvailable()).thenReturn(true);
        when(webpConverter.fromPng(any())).thenReturn(Optional.of(WEBP));

        optimizer(storage).optimizeStoredPortraits();

        assertThat(hero.getPortraitUrl()).isEqualTo("heroes/ana.webp");
        assertThat(Files.exists(directory.resolve("heroes/ana.webp"))).isTrue();
        assertThat(Files.exists(directory.resolve("heroes/ana.png"))).isFalse();
        verify(heroRepository).save(hero);
        verify(cacheEviction).evictAll();
    }

    @Test
    void keepsThePngWhenTheConversionFails() {
        MediaStorage storage = storage();
        storage.save(MediaFolder.HEROES, "ana.png", PNG);
        Hero hero = hero("ana", "heroes/ana.png");
        when(heroRepository.findAll()).thenReturn(List.of(hero));
        when(webpConverter.isAvailable()).thenReturn(true);
        when(webpConverter.fromPng(any())).thenReturn(Optional.empty());

        optimizer(storage).optimizeStoredPortraits();

        assertThat(hero.getPortraitUrl()).isEqualTo("heroes/ana.png");
        assertThat(Files.exists(directory.resolve("heroes/ana.png"))).isTrue();
        verify(heroRepository, never()).save(any());
        verify(cacheEviction, never()).evictAll();
    }

    @Test
    void doesNothingWhenTheConverterIsNotInstalled() {
        MediaStorage storage = storage();
        storage.save(MediaFolder.HEROES, "ana.png", PNG);
        when(heroRepository.findAll()).thenReturn(List.of(hero("ana", "heroes/ana.png")));
        when(webpConverter.isAvailable()).thenReturn(false);

        optimizer(storage).optimizeStoredPortraits();

        verify(webpConverter, never()).fromPng(any());
        assertThat(Files.exists(directory.resolve("heroes/ana.png"))).isTrue();
    }

    @Test
    void ignoresWebpPortraitsAndAddressesSetByAnAdministrator() {
        when(heroRepository.findAll()).thenReturn(List.of(hero("ana", "heroes/ana.webp"),
                hero("kiriko", "https://cdn.example/kiriko.png"), hero("mercy", null)));

        optimizer(storage()).optimizeStoredPortraits();

        verify(webpConverter, never()).isAvailable();
        verify(heroRepository, never()).save(any());
    }

    @Test
    void skipsAHeroWhoseFileIsMissing() {
        Hero hero = hero("ana", "heroes/ana.png");
        when(heroRepository.findAll()).thenReturn(List.of(hero));
        when(webpConverter.isAvailable()).thenReturn(true);

        optimizer(storage()).optimizeStoredPortraits();

        assertThat(hero.getPortraitUrl()).isEqualTo("heroes/ana.png");
        verify(heroRepository, never()).save(any());
    }
}
