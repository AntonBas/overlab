package gg.overlab.backend.common;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;
import org.junit.jupiter.api.Test;

class SlugServiceTest {

    private final SlugService slugService = new SlugService();

    @Test
    void joinsWordsWithDashes() {
        assertThat(slugService.generate("Illari: Pylons on Rialto")).isEqualTo("illari-pylons-on-rialto");
    }

    @Test
    void stripsDiacriticsAndPunctuation() {
        assertThat(slugService.generate("Lúcio's Esperança!")).isEqualTo("lucios-esperanca");
    }

    @Test
    void transliteratesCyrillic() {
        assertThat(slugService.generate("Пілони Illari на Ріальто")).isEqualTo("pilony-illari-na-rialto");
    }

    @Test
    void dropsApostrophesLikeBlizzardSlugs() {
        assertThat(slugService.generate("King's Row")).isEqualTo("kings-row");
    }

    @Test
    void convertsVersionNumbers() {
        assertThat(slugService.generate("15.2")).isEqualTo("15-2");
    }

    @Test
    void fallsBackWhenNothingUsable() {
        assertThat(slugService.generate("???")).isEqualTo("item");
        assertThat(slugService.generate("  ")).isEqualTo("item");
        assertThat(slugService.generate(null)).isEqualTo("item");
    }

    @Test
    void addsCounterUntilSlugIsFree() {
        Set<String> taken = Set.of("pylons", "pylons-1");

        assertThat(slugService.generateUnique("Pylons", taken::contains)).isEqualTo("pylons-2");
        assertThat(slugService.generateUnique("Other", taken::contains)).isEqualTo("other");
    }
}
