package gg.overlab.backend.collector.imports;

import java.time.Instant;
import java.util.List;

public record PatchesImportedEvent(List<Instant> releaseDates) {
}
