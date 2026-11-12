package gg.overlab.backend.collector;

import gg.overlab.backend.collector.client.BlizzardRatesClient;
import gg.overlab.backend.collector.client.BlizzardRatesResponse;
import gg.overlab.backend.collector.client.RatesFetch;
import gg.overlab.backend.collector.media.HeroAssetService;
import gg.overlab.backend.collector.snapshot.RatesValidator;
import gg.overlab.backend.collector.snapshot.SnapshotRecorder;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SnapshotCollector {

    private final CollectorProperties properties;
    private final BlizzardRatesClient client;
    private final RatesValidator validator;
    private final SnapshotRecorder recorder;
    private final HeroAssetService heroAssets;
    private final CollectorMetrics metrics;

    int collect(Instant capturedAt, SnapshotRequest request) {
        String knownEtag = recorder.knownEtag(request.queue(), request.platform(), request.region(), request.tier(),
                request.mapSlug()).orElse(null);
        RatesFetch fetched = client.fetch(request.queue(), request.platform(), request.region(), request.tier(),
                request.mapSlug(), knownEtag);
        if (fetched.notModified() && recorder.markUnchanged(capturedAt, request.queue(), request.platform(),
                request.region(), request.tier(), request.mapSlug())) {
            metrics.recordUnchangedSnapshot();
            return 0;
        }
        RatesFetch usable = fetched.notModified()
                ? client.fetch(request.queue(), request.platform(), request.region(), request.tier(),
                        request.mapSlug())
                : fetched;
        validator.validate(usable.rates());
        List<BlizzardRatesResponse.HeroRate> heroesWithData = validator.withoutEmptyEntries(usable.rates());
        validator.validateEnoughWithData(heroesWithData);
        validator.validateBanRates(request.queue(), heroesWithData);
        SnapshotRecorder.Outcome outcome = recorder.record(capturedAt, request.queue(), properties.gameFormat(),
                request.platform(), request.region(), request.tier(), request.mapSlug(), heroesWithData,
                usable.etag());
        if (outcome.changed()) {
            heroAssets.ensureAssets(heroesWithData);
        } else {
            metrics.recordUnchangedSnapshot();
        }
        return outcome.rowsSaved();
    }
}
