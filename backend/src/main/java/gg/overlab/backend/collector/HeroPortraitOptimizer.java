package gg.overlab.backend.collector;

import gg.overlab.backend.config.cache.CacheEviction;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.media.MediaFolder;
import gg.overlab.backend.media.MediaStorage;
import gg.overlab.backend.media.WebpConverter;
import java.util.List;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class HeroPortraitOptimizer {

    private static final String PNG_EXTENSION = ".png";

    private final HeroRepository heroRepository;
    private final MediaStorage mediaStorage;
    private final WebpConverter webpConverter;
    private final CacheEviction cacheEviction;

    public HeroPortraitOptimizer(HeroRepository heroRepository, MediaStorage mediaStorage,
                                 WebpConverter webpConverter, CacheEviction cacheEviction) {
        this.heroRepository = heroRepository;
        this.mediaStorage = mediaStorage;
        this.webpConverter = webpConverter;
        this.cacheEviction = cacheEviction;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void optimizeStoredPortraits() {
        List<Hero> candidates = heroRepository.findAll().stream().filter(this::isStoredPng).toList();
        if (candidates.isEmpty() || !webpConverter.isAvailable()) {
            return;
        }
        int converted = 0;
        for (Hero hero : candidates) {
            try {
                if (optimize(hero)) {
                    converted++;
                }
            } catch (RuntimeException exception) {
                log.warn("Could not optimize the portrait of {}: {}", hero.getSlug(), exception.getMessage());
            }
        }
        if (converted > 0) {
            cacheEviction.evictAll();
            log.info("Converted {} hero portraits to WebP", converted);
        }
    }

    private boolean isStoredPng(Hero hero) {
        String stored = hero.getPortraitUrl();
        return stored != null && !stored.startsWith("http") && !stored.startsWith("/")
                && stored.endsWith(PNG_EXTENSION);
    }

    private boolean optimize(Hero hero) {
        String previousPath = hero.getPortraitUrl();
        Optional<byte[]> webp = mediaStorage.read(previousPath).flatMap(webpConverter::fromPng);
        if (webp.isEmpty()) {
            return false;
        }
        hero.setPortraitUrl(mediaStorage.save(MediaFolder.HEROES, hero.getSlug() + ".webp", webp.get()));
        heroRepository.save(hero);
        mediaStorage.delete(previousPath);
        return true;
    }
}
