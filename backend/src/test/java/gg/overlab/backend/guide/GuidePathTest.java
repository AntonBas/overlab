package gg.overlab.backend.guide;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class GuidePathTest {

    @Test
    void readsTheIdFromALegacyPathWithAnIdPrefix() {
        assertThat(GuidePath.legacyId("42-any-title")).contains(42L);
    }

    @Test
    void ignoresPathsWithoutALegacyIdPrefix() {
        assertThat(GuidePath.legacyId("title-only")).isEmpty();
        assertThat(GuidePath.legacyId("42")).isEmpty();
        assertThat(GuidePath.legacyId("99999999999999999999-title")).isEmpty();
        assertThat(GuidePath.legacyId(null)).isEmpty();
    }
}
