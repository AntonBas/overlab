package gg.overlab.backend.patch;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class PatchSeasonsTest {

    private static Patch patch(long id, String title, String releasedAt) {
        Patch patch = new Patch();
        ReflectionTestUtils.setField(patch, "id", id);
        patch.setTitle(title);
        patch.setReleasedAt(Instant.parse(releasedAt));
        return patch;
    }

    @Test
    void readsTheSeasonNumberFromATitle() {
        assertThat(PatchSeasons.fromTitle("Reign of Talon - Season 5: A Grim Doctrine")).isEqualTo(5);
        assertThat(PatchSeasons.fromTitle("SEASON 12")).isEqualTo(12);
        assertThat(PatchSeasons.fromTitle("Hotfix Update")).isNull();
        assertThat(PatchSeasons.fromTitle("Seasonal event")).isNull();
        assertThat(PatchSeasons.fromTitle(null)).isNull();
    }

    @Test
    void laterPatchesKeepTheSeasonUntilTheNextOneIsAnnounced() {
        List<Patch> patches = List.of(
                patch(4, "Hotfix Update", "2026-11-05T00:00:00Z"),
                patch(3, "Taking Reign", "2026-11-03T00:00:00Z"),
                patch(2, "Hotfix Update", "2026-10-13T00:00:00Z"),
                patch(1, "Reign of Talon - Season 5", "2026-10-06T00:00:00Z"),
                patch(0, "Hotfix Update", "2026-09-01T00:00:00Z"));

        Map<Long, Integer> seasons = PatchSeasons.resolve(patches);

        assertThat(seasons).containsOnlyKeys(1L, 2L, 3L, 4L);
        assertThat(seasons.values()).containsOnly(5);
    }

    @Test
    void aNewSeasonStartsAtItsOwnPatch() {
        List<Patch> patches = List.of(
                patch(3, "Hotfix Update", "2026-12-20T00:00:00Z"),
                patch(2, "Overwatch Season 6", "2026-12-10T00:00:00Z"),
                patch(1, "Hotfix Update", "2026-11-05T00:00:00Z"),
                patch(0, "Overwatch Season 5", "2026-10-06T00:00:00Z"));

        Map<Long, Integer> seasons = PatchSeasons.resolve(patches);

        assertThat(seasons).containsEntry(0L, 5).containsEntry(1L, 5).containsEntry(2L, 6).containsEntry(3L, 6);
    }
}
