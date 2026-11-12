package gg.overlab.backend.collector;

import gg.overlab.backend.stats.GameQueue;
import gg.overlab.backend.stats.Platform;
import gg.overlab.backend.stats.RankTier;
import gg.overlab.backend.stats.Region;
import java.util.ArrayList;
import java.util.List;

record SnapshotRequest(GameQueue queue, Platform platform, Region region, RankTier tier, String mapSlug) {

    static List<SnapshotRequest> plan(CollectorJob job, List<String> mapSlugs) {
        List<SnapshotRequest> requests = new ArrayList<>();
        for (GameQueue queue : job.queues()) {
            for (Platform platform : job.platforms()) {
                for (Region region : job.regions()) {
                    for (RankTier tier : job.tiers()) {
                        if (queue == GameQueue.QUICK_PLAY && tier != RankTier.ALL) {
                            continue;
                        }
                        for (String mapSlug : mapSlugs) {
                            requests.add(new SnapshotRequest(queue, platform, region, tier, mapSlug));
                        }
                    }
                }
            }
        }
        return requests;
    }

    String describe(RuntimeException exception) {
        return queue + "/" + platform + "/" + region + "/" + tier + "/" + mapSlug + ": " + exception.getMessage();
    }
}
