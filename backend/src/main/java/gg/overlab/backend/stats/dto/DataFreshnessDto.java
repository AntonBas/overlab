package gg.overlab.backend.stats.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.io.Serializable;
import java.time.Instant;

public record DataFreshnessDto(
        @Schema(description = "When the latest snapshot was stored") Instant capturedAt,
        @Schema(description = "When the numbers were last checked against Blizzard") Instant lastCheckedAt,
        @Schema(description = "First snapshot that already had the current numbers") Instant valuesSince,
        @Schema(description = "How many snapshots were looked at") int snapshotCount,
        @Schema(description = "True when an earlier snapshot with different numbers was seen") boolean changeObserved)
        implements Serializable {
}
