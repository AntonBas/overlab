package gg.overlab.backend.patch.dto;

import java.io.Serializable;
import java.time.Instant;

public record PatchDto(Long id, String version, String slug, String title, Instant releasedAt, String notes)
        implements Serializable {
}
