package gg.overlab.backend.collector.imports;

import gg.overlab.backend.collector.CollectorProperties;
import gg.overlab.backend.collector.client.PatchNotesClient;
import gg.overlab.backend.collector.parser.ParsedPatch;
import gg.overlab.backend.collector.parser.PatchNotesFormatException;
import gg.overlab.backend.collector.parser.PatchNotesParser;
import gg.overlab.backend.common.SlugService;
import gg.overlab.backend.config.cache.EvictContentCaches;
import gg.overlab.backend.exception.core.UpstreamUnavailableException;
import gg.overlab.backend.patch.Patch;
import gg.overlab.backend.patch.PatchRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestClientException;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatchImportService {

    private final CollectorProperties properties;
    private final PatchNotesClient client;
    private final PatchNotesParser parser;
    private final PatchRepository patchRepository;
    private final SlugService slugService;
    private final ApplicationEventPublisher eventPublisher;
    private final TransactionTemplate transactionTemplate;

    @EvictContentCaches
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
        Map<LocalDate, Integer> entriesPerDate = new HashMap<>();
        for (ParsedPatch entry : parsed) {
            int sameDayIndex = entriesPerDate.merge(entry.date(), 1, Integer::sum);
            String version = sameDayIndex == 1 ? entry.date().toString() : entry.date() + "-" + sameDayIndex;
            if (patchRepository.existsByVersionIgnoreCase(version)) {
                continue;
            }
            Patch patch = new Patch();
            patch.setVersion(version);
            patch.setSlug(slugService.generateUnique(version, patchRepository::existsBySlug));
            patch.setTitle(entry.title());
            Instant releasedAt = entry.date().atStartOfDay(ZoneOffset.UTC).toInstant();
            patch.setReleasedAt(releasedAt);
            patch.setNotes(properties.baseUrl() + PatchNotesClient.PATCH_NOTES_PATH + "#patch-" + entry.date());
            patchRepository.save(patch);
            createdReleases.add(releasedAt);
        }
        log.info("Patch import finished: {} balance patches found, {} new", parsed.size(), createdReleases.size());
        if (!createdReleases.isEmpty()) {
            eventPublisher.publishEvent(new PatchesImportedEvent(List.copyOf(createdReleases)));
        }
        return createdReleases.size();
    }
}
