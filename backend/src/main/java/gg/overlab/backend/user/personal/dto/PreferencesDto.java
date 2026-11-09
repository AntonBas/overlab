package gg.overlab.backend.user.personal.dto;

import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;

public record PreferencesDto(GameQueue queue, Platform platform, Region region, RankTier tier) {
}
