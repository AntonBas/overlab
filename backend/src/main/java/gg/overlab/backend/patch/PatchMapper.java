package gg.overlab.backend.patch;

import gg.overlab.backend.patch.dto.PatchDto;
import gg.overlab.backend.patch.dto.PatchRequest;
import org.springframework.stereotype.Component;

@Component
public class PatchMapper {

    public PatchDto toDto(Patch patch) {
        return new PatchDto(patch.getId(), patch.getVersion(), patch.getSlug(), patch.getTitle(),
                patch.getReleasedAt(), patch.getNotes());
    }

    public void apply(PatchRequest request, Patch patch) {
        patch.setVersion(request.version().trim());
        patch.setTitle(request.title());
        patch.setReleasedAt(request.releasedAt());
        patch.setNotes(request.notes());
    }
}
