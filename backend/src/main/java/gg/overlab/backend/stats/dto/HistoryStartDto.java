package gg.overlab.backend.stats.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.io.Serializable;
import java.time.Instant;

public record HistoryStartDto(
        @Schema(description = "First stored snapshot, empty when nothing has been collected") Instant firstCapturedAt)
        implements Serializable {
}
