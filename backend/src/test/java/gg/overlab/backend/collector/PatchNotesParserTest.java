package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;

class PatchNotesParserTest {

    static final String PAGE = """
            <html><body>
            <div class="PatchNotes-patch PatchNotes-live">
              <div class="PatchNotes-labels"><div class="PatchNotes-date">October 20, 2026</div></div>
              <h2 class="PatchNotes-patchTitle">Retail Patch Notes - October 20, 2026</h2>
              <div class="PatchNotes-section PatchNotes-section-generic_update">
                <h4 class="PatchNotes-sectionTitle">Bug Fix Update</h4>
              </div>
              <div class="PatchNotes-section PatchNotes-section-generic_update">
                <h4 class="PatchNotes-sectionTitle">Bug Fixes</h4>
              </div>
            </div>
            <div class="PatchNotes-patch PatchNotes-live">
              <div class="PatchNotes-labels"><div class="PatchNotes-date">October 13, 2026</div></div>
              <div class="PatchNotes-section PatchNotes-section-generic_update">
                <h4 class="PatchNotes-sectionTitle">Hotfix Update</h4>
              </div>
              <div class="PatchNotes-section PatchNotes-section-hero_update">
                <h4 class="PatchNotes-sectionTitle">Hero Updates</h4>
              </div>
            </div>
            <div class="PatchNotes-patch PatchNotes-live">
              <div class="PatchNotes-labels"><div class="PatchNotes-date">October 6, 2026</div></div>
              <div class="PatchNotes-section PatchNotes-section-generic_update">
                <h4 class="PatchNotes-sectionTitle">Reign of Talon - Season 5: A Grim Doctrine</h4>
              </div>
              <div class="PatchNotes-section PatchNotes-section-hero_update">
                <h4 class="PatchNotes-sectionTitle">Hero Updates</h4>
              </div>
            </div>
            <div class="PatchNotes-patch PatchNotes-live">
              <div class="PatchNotes-labels"><div class="PatchNotes-date">September 30, 2026</div></div>
              <div class="PatchNotes-section PatchNotes-section-map_update">
                <h4 class="PatchNotes-sectionTitle">Map Updates</h4>
              </div>
            </div>
            <div class="PatchNotes-patch PatchNotes-live">
              <div class="PatchNotes-labels"><div class="PatchNotes-date">not a date</div></div>
              <div class="PatchNotes-section PatchNotes-section-hero_update">
                <h4 class="PatchNotes-sectionTitle">Hero Updates</h4>
              </div>
            </div>
            </body></html>
            """;

    private final PatchNotesParser parser = new PatchNotesParser();

    @Test
    void keepsOnlyPatchesThatChangeHeroesOrMaps() {
        List<ParsedPatch> patches = parser.parse(PAGE);

        assertThat(patches).extracting(ParsedPatch::date)
                .containsExactly(LocalDate.of(2026, 10, 13), LocalDate.of(2026, 10, 6), LocalDate.of(2026, 9, 30));
    }

    @Test
    void namesSeasonPatchesAfterTheSeason() {
        List<ParsedPatch> patches = parser.parse(PAGE);

        assertThat(patches.get(1).title()).isEqualTo("Reign of Talon - Season 5: A Grim Doctrine");
    }

    @Test
    void fallsBackToTheFirstSectionTitle() {
        List<ParsedPatch> patches = parser.parse(PAGE);

        assertThat(patches.get(0).title()).isEqualTo("Hotfix Update");
        assertThat(patches.get(2).title()).isEqualTo("Map Updates");
    }

    @Test
    void failsWhenThePageHasNoPatchBlocks() {
        assertThatThrownBy(() -> parser.parse("<html><body><p>moved</p></body></html>"))
                .isInstanceOf(PatchNotesFormatException.class);
    }
}
