package gg.overlab.backend.collector;

import gg.overlab.backend.config.async.AsyncConfig;
import gg.overlab.backend.config.cache.CacheNames;
import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.core.task.TaskExecutor;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class PerkImportService {

    private final CollectorProperties properties;
    private final HeroRepository heroRepository;
    private final BlizzardHeroPageClient pageClient;
    private final HeroPerkParser parser;
    private final HeroAbilityParser abilityParser;
    private final ImageDownloader imageDownloader;
    private final PerkImportWriter writer;
    private final AbilityImportWriter abilityWriter;
    private final CacheManager cacheManager;
    private final TaskExecutor executor;
    private final AtomicBoolean running = new AtomicBoolean();

    public PerkImportService(CollectorProperties properties, HeroRepository heroRepository,
                             BlizzardHeroPageClient pageClient, HeroPerkParser parser,
                             HeroAbilityParser abilityParser, ImageDownloader imageDownloader,
                             PerkImportWriter writer, AbilityImportWriter abilityWriter, CacheManager cacheManager,
                             @Qualifier(AsyncConfig.COLLECTOR_EXECUTOR) TaskExecutor executor) {
        this.properties = properties;
        this.heroRepository = heroRepository;
        this.pageClient = pageClient;
        this.parser = parser;
        this.abilityParser = abilityParser;
        this.imageDownloader = imageDownloader;
        this.writer = writer;
        this.abilityWriter = abilityWriter;
        this.cacheManager = cacheManager;
        this.executor = executor;
    }

    public int startAsync() {
        if (!properties.importPerks()) {
            throw new BadRequestException("Perk import is disabled, set COLLECTOR_IMPORT_PERKS=true");
        }
        if (!running.compareAndSet(false, true)) {
            throw new ConflictException("Perk import is already running");
        }
        try {
            List<String> slugs = heroRepository.findAll().stream().filter(Hero::isActive).map(Hero::getSlug).toList();
            executor.execute(() -> run(slugs));
            return slugs.size();
        } catch (RuntimeException exception) {
            running.set(false);
            throw exception;
        }
    }

    private void run(List<String> slugs) {
        int created = 0;
        int updated = 0;
        int failed = 0;
        try {
            for (String slug : slugs) {
                try {
                    PerkImportWriter.Counts counts = importHero(slug);
                    created += counts.created();
                    updated += counts.updated();
                } catch (RuntimeException exception) {
                    failed++;
                    log.warn("Perk import failed for {}: {}", slug, exception.getMessage());
                }
                sleep(properties.pause());
            }
            clearContentCache();
            log.info("Perk and ability import finished: {} created, {} updated, {} of {} heroes failed", created, updated,
                    failed, slugs.size());
        } finally {
            running.set(false);
        }
    }

    private PerkImportWriter.Counts importHero(String slug) {
        Optional<String> page = pageClient.fetch(slug);
        if (page.isEmpty()) {
            log.warn("No Blizzard page for hero {}", slug);
            return new PerkImportWriter.Counts(0, 0);
        }
        PerkImportWriter.Counts perkCounts = writer.write(slug, parser.parse(page.get()), imageDownloader::downloadPng);
        PerkImportWriter.Counts abilityCounts = abilityWriter.write(slug, abilityParser.parse(page.get()),
                imageDownloader::downloadPng);
        return new PerkImportWriter.Counts(perkCounts.created() + abilityCounts.created(),
                perkCounts.updated() + abilityCounts.updated());
    }

    private void clearContentCache() {
        Cache cache = cacheManager.getCache(CacheNames.CONTENT);
        if (cache != null) {
            cache.clear();
        }
    }

    private void sleep(Duration delay) {
        try {
            Thread.sleep(delay);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        }
    }
}
