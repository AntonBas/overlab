package gg.overlab.backend.collector.imports;

import gg.overlab.backend.collector.CollectorProperties;
import gg.overlab.backend.collector.client.PatchNotesClient;
import gg.overlab.backend.collector.parser.ParsedPatch;
import gg.overlab.backend.collector.parser.PatchNotesFormatException;
import gg.overlab.backend.collector.parser.PatchNotesParser;
import gg.overlab.backend.common.Pause;
import gg.overlab.backend.common.ScheduledJobLock;
import gg.overlab.backend.common.SlugService;
import gg.overlab.backend.config.async.AsyncConfig;
import gg.overlab.backend.config.cache.CacheEviction;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.exception.core.UpstreamUnavailableException;
import gg.overlab.backend.patch.Patch;
import gg.overlab.backend.patch.PatchRepository;
import gg.overlab.backend.patch.PatchService;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.concurrent.atomic.AtomicBoolean;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.task.TaskExecutor;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestClientException;

@Slf4j
@Service
public class PatchImportService {

    private final CollectorProperties properties;
    private final PatchNotesClient client;
    private final PatchNotesParser parser;
    private final PatchRepository patchRepository;
    private final SlugService slugService;
    private final ApplicationEventPublisher eventPublisher;
    private final TransactionTemplate transactionTemplate;
    private final TaskExecutor executor;
    private final ScheduledJobLock jobLock;
    private final CacheEviction cacheEviction;
    private final AtomicBoolean running = new AtomicBoolean();

    public PatchImportService(CollectorProperties properties, PatchNotesClient client, PatchNotesParser parser,
                              PatchRepository patchRepository, SlugService slugService,
                              ApplicationEventPublisher eventPublisher, TransactionTemplate transactionTemplate,
                              @Qualifier(AsyncConfig.COLLECTOR_EXECUTOR) TaskExecutor executor,
                              ScheduledJobLock jobLock, CacheEviction cacheEviction) {
        this.properties = properties;
        this.client = client;
        this.parser = parser;
        this.patchRepository = patchRepository;
        this.slugService = slugService;
        this.eventPublisher = eventPublisher;
        this.transactionTemplate = transactionTemplate;
        this.executor = executor;
        this.jobLock = jobLock;
        this.cacheEviction = cacheEviction;
    }

    public void startAsync() {
        if (!running.compareAndSet(false, true)) {
            throw new ConflictException("Patch import is already running");
        }
        try {
            executor.execute(this::runInBackground);
        } catch (TaskRejectedException exception) {
            running.set(false);
            throw new ConflictException("Collector queue is full, the patch import was not started");
        }
    }

    public boolean isStale(Duration threshold) {
        return patchRepository.findAllByOrderByReleasedAtDesc().stream().findFirst()
                .map(newest -> newest.getReleasedAt().isBefore(Instant.now().minus(threshold)))
                .orElse(true);
    }

    private void runInBackground() {
        try {
            jobLock.callExclusively("patch-import", this::importNew)
                    .filter(created -> created > 0)
                    .ifPresent(created -> cacheEviction.evictAll());
        } catch (RuntimeException exception) {
            log.error("Patch import failed", exception);
        } finally {
            Pause.sleep(properties.pause());
            running.set(false);
        }
    }

    public int importNew() {
        List<ParsedPatch> parsed;
        try {
            parsed = parser.parse(client.fetch());
        } catch (RestClientException | PatchNotesFormatException exception) {
            throw new UpstreamUnavailableException("Blizzard patch notes could not be read: "
                    + exception.getMessage());
        }
        Integer created = transactionTemplate.execute(status -> saveNew(parsed));
        return created == null ? 0 : created;
    }

    private int saveNew(List<ParsedPatch> parsed) {
        List<Instant> createdReleases = new ArrayList<>();
        Map<LocalDate, Long> totalPerDate = parsed.stream()
                .collect(Collectors.groupingBy(ParsedPatch::date, Collectors.counting()));
        Map<LocalDate, Integer> seenPerDate = new HashMap<>();
        for (ParsedPatch entry : parsed) {
            int pagePosition = seenPerDate.merge(entry.date(), 1, Integer::sum) - 1;
            Instant dayStart = entry.date().atStartOfDay(ZoneOffset.UTC).toInstant();
            long newOnThisDay = totalPerDate.get(entry.date()) - patchRepository.countByReleasedAt(dayStart);
            if (pagePosition >= newOnThisDay) {
                continue;
            }
            long chronologicalIndex = totalPerDate.get(entry.date()) - pagePosition;
            String version = chronologicalIndex == 1 ? entry.date().toString()
                    : entry.date() + "-" + chronologicalIndex;
            if (patchRepository.existsByVersionIgnoreCase(version)) {
                continue;
            }
            Patch patch = new Patch();
            patch.setVersion(version);
            patch.setSlug(slugService.generateUnique(version, PatchService.MAX_SLUG_LENGTH,
                    patchRepository::existsBySlug));
            patch.setTitle(entry.title());
            patch.setReleasedAt(dayStart);
            patch.setNotes(properties.baseUrl() + PatchNotesClient.PATCH_NOTES_PATH + "#patch-" + entry.date());
            patchRepository.save(patch);
            createdReleases.add(dayStart);
        }
        log.info("Patch import finished: {} balance patches found, {} new", parsed.size(), createdReleases.size());
        if (!createdReleases.isEmpty()) {
            eventPublisher.publishEvent(new PatchesImportedEvent(List.copyOf(createdReleases)));
        }
        return createdReleases.size();
    }
}
