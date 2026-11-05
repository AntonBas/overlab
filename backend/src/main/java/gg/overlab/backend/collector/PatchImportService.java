package gg.overlab.backend.collector;

import gg.overlab.backend.common.SlugService;
import gg.overlab.backend.config.cache.EvictContentCaches;
import gg.overlab.backend.patch.Patch;
import gg.overlab.backend.patch.PatchRepository;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @EvictContentCaches
    @Transactional
    public int importNew() {
        List<ParsedPatch> parsed = parser.parse(client.fetch());
        List<Instant> createdReleases = new ArrayList<>();
        for (ParsedPatch entry : parsed) {
            String version = entry.date().toString();
            if (patchRepository.existsByVersionIgnoreCase(version)) {
                continue;
            }
            Patch patch = new Patch();
            patch.setVersion(version);
            patch.setSlug(slugService.generateUnique(version, patchRepository::existsBySlug));
            patch.setTitle(entry.title());
            Instant releasedAt = entry.date().atStartOfDay(ZoneOffset.UTC).toInstant();
            patch.setReleasedAt(releasedAt);
            patch.setNotes(properties.baseUrl() + PatchNotesClient.PATCH_NOTES_PATH + "#patch-" + version);
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
