package gg.overlab.backend.collector;

import gg.overlab.backend.config.async.AsyncConfig;
import gg.overlab.backend.config.cache.CacheEviction;
import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import java.time.Duration;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Function;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
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
    private final CacheEviction cacheEviction;
    private final TaskExecutor executor;
    private final AtomicBoolean running = new AtomicBoolean();

    public PerkImportService(CollectorProperties properties, HeroRepository heroRepository,
                             BlizzardHeroPageClient pageClient, HeroPerkParser parser,
                             HeroAbilityParser abilityParser, ImageDownloader imageDownloader,
                             PerkImportWriter writer, AbilityImportWriter abilityWriter, CacheEviction cacheEviction,
                             @Qualifier(AsyncConfig.COLLECTOR_EXECUTOR) TaskExecutor executor) {
        this.properties = properties;
        this.heroRepository = heroRepository;
        this.pageClient = pageClient;
        this.parser = parser;
        this.abilityParser = abilityParser;
        this.imageDownloader = imageDownloader;
        this.writer = writer;
        this.abilityWriter = abilityWriter;
        this.cacheEviction = cacheEviction;
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
        int removed = 0;
        int failed = 0;
        try {
            for (String slug : slugs) {
                try {
                    PerkImportWriter.Counts counts = importHero(slug);
                    created += counts.created();
                    updated += counts.updated();
                    removed += counts.removed();
                } catch (RuntimeException exception) {
                    failed++;
                    log.warn("Perk import failed for {}: {}", slug, exception.getMessage());
                }
                sleep(properties.pause());
            }
            cacheEviction.evictAll();
            log.info("Perk and ability import finished: {} created, {} updated, {} removed, {} of {} heroes failed",
                    created, updated, removed, failed, slugs.size());
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
        List<ParsedPerk> perks = parser.parse(page.get());
        List<ParsedAbility> abilities = abilityParser.parse(page.get());
        Map<String, Optional<byte[]>> icons = downloadMissingIcons(slug, perks, abilities);
        Function<String, Optional<byte[]>> iconLoader = url -> icons.getOrDefault(url, Optional.empty());
        PerkImportWriter.Counts perkCounts = writer.write(slug, perks, iconLoader);
        PerkImportWriter.Counts abilityCounts = abilityWriter.write(slug, abilities, iconLoader);
        return new PerkImportWriter.Counts(perkCounts.created() + abilityCounts.created(),
                perkCounts.updated() + abilityCounts.updated(), perkCounts.removed() + abilityCounts.removed());
    }

    private Map<String, Optional<byte[]>> downloadMissingIcons(String slug, List<ParsedPerk> perks,
                                                               List<ParsedAbility> abilities) {
        Set<String> urls = new LinkedHashSet<>(writer.missingIconUrls(slug, perks));
        urls.addAll(abilityWriter.missingIconUrls(slug, abilities));
        Map<String, Optional<byte[]>> icons = new HashMap<>();
        urls.forEach(url -> icons.put(url, imageDownloader.downloadPng(url)));
        return icons;
    }

    private void sleep(Duration delay) {
        try {
            Thread.sleep(delay);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        }
    }
}
