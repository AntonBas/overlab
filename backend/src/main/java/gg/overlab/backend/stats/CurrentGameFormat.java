package gg.overlab.backend.stats;

import gg.overlab.backend.config.cache.CacheNames;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CurrentGameFormat {

    private static final GameFormat FALLBACK = GameFormat.FIVE_VS_FIVE;

    private final HeroStatRepository heroStatRepository;

    @Cacheable(value = CacheNames.STATS, key = "'game-format'")
    @Transactional(readOnly = true)
    public GameFormat get() {
        return heroStatRepository.findFirstByOrderByCapturedAtDesc()
                .map(HeroStat::getGameFormat)
                .orElse(FALLBACK);
    }
}
