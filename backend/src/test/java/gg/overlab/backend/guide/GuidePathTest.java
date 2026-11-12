package gg.overlab.backend.guide;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import gg.overlab.backend.exception.core.EntityNotFoundException;
import org.junit.jupiter.api.Test;

class GuidePathTest {

    @Test
    void readsTheIdFromAPathWithOrWithoutSlug() {
        assertThat(GuidePath.parseId("42")).contains(42L);
        assertThat(GuidePath.parseId("42-any-title")).contains(42L);
    }

    @Test
    void rejectsPathsWithoutAValidId() {
        assertThat(GuidePath.parseId("title-only")).isEmpty();
        assertThat(GuidePath.parseId("99999999999999999999")).isEmpty();
        assertThat(GuidePath.parseId(null)).isEmpty();
        assertThatThrownBy(() -> GuidePath.idOf("title-only")).isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void buildsThePathFromIdAndSlug() {
        assertThat(GuidePath.of(7L, "ana-nade")).isEqualTo("7-ana-nade");
    }
}
