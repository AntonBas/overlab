package gg.overlab.backend.collector;

import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.media.MediaFolder;
import gg.overlab.backend.media.MediaStorage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class HeroPortraitDownloader {

    private final ImageDownloader imageDownloader;
    private final MediaStorage mediaStorage;
    private final boolean enabled;

    @Autowired
    public HeroPortraitDownloader(CollectorProperties properties, ImageDownloader imageDownloader,
                                  MediaStorage mediaStorage) {
        this(imageDownloader, mediaStorage, properties.downloadPortraits());
    }

    HeroPortraitDownloader(ImageDownloader imageDownloader, MediaStorage mediaStorage, boolean enabled) {
        this.imageDownloader = imageDownloader;
        this.mediaStorage = mediaStorage;
        this.enabled = enabled;
    }

    public void ensurePortrait(Hero hero, String sourceUrl) {
        if (!enabled || hasPortrait(hero)) {
            return;
        }
        imageDownloader.downloadPng(sourceUrl).ifPresent(content ->
                hero.setPortraitUrl(mediaStorage.save(MediaFolder.HEROES, hero.getSlug() + ".png", content)));
    }

    private boolean hasPortrait(Hero hero) {
        String stored = hero.getPortraitUrl();
        if (stored == null || stored.isBlank()) {
            return false;
        }
        return stored.startsWith("http") || mediaStorage.exists(stored);
    }
}
