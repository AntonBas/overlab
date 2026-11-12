package gg.overlab.backend.collector.media;

import gg.overlab.backend.collector.CollectorProperties;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.media.MediaFolder;
import gg.overlab.backend.media.MediaStorage;
import gg.overlab.backend.media.WebpConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class HeroPortraitDownloader {

    private final ImageDownloader imageDownloader;
    private final MediaStorage mediaStorage;
    private final WebpConverter webpConverter;
    private final boolean enabled;

    @Autowired
    public HeroPortraitDownloader(CollectorProperties properties, ImageDownloader imageDownloader,
                                  MediaStorage mediaStorage, WebpConverter webpConverter) {
        this(imageDownloader, mediaStorage, webpConverter, properties.downloadPortraits());
    }

    HeroPortraitDownloader(ImageDownloader imageDownloader, MediaStorage mediaStorage,
                           WebpConverter webpConverter, boolean enabled) {
        this.imageDownloader = imageDownloader;
        this.mediaStorage = mediaStorage;
        this.webpConverter = webpConverter;
        this.enabled = enabled;
    }

    public void ensurePortrait(Hero hero, String sourceUrl) {
        if (!enabled || hasPortrait(hero)) {
            return;
        }
        imageDownloader.downloadPng(sourceUrl).ifPresent(content -> hero.setPortraitUrl(store(hero, content)));
    }

    private String store(Hero hero, byte[] png) {
        return webpConverter.fromPng(png)
                .map(webp -> mediaStorage.save(MediaFolder.HEROES, hero.getSlug() + ".webp", webp))
                .orElseGet(() -> mediaStorage.save(MediaFolder.HEROES, hero.getSlug() + ".png", png));
    }

    private boolean hasPortrait(Hero hero) {
        String stored = hero.getPortraitUrl();
        if (stored == null || stored.isBlank()) {
            return false;
        }
        return stored.startsWith("http") || mediaStorage.exists(stored);
    }
}
