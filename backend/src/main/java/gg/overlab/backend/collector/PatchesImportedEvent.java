package gg.overlab.backend.collector;

import java.time.Instant;
import java.util.List;

public record PatchesImportedEvent(List<Instant> releaseDates) {
}
