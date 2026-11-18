package gg.overlab.backend.patch;

import gg.overlab.backend.config.cache.CacheNames;
import java.util.HashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class PatchSeasonLookup {

    private final PatchRepository patchRepository;

    @Cacheable(value = CacheNames.CONTENT, key = "'patch-seasons'")
    @Transactional(readOnly = true)
    public HashMap<Long, Integer> seasonsById() {
        return new HashMap<>(PatchSeasons.resolve(patchRepository.findAllByOrderByReleasedAtDesc()));
    }
}
