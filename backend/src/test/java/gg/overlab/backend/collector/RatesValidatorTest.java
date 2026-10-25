package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class RatesValidatorTest {

    private final RatesValidator validator = new RatesValidator(CollectorFixtures.properties(1));

    @Test
    void acceptsAValidSnapshot() {
        assertThatCode(() -> validator.validate(CollectorFixtures.rates(5))).doesNotThrowAnyException();
    }

    @Test
    void acceptsMissingBanRate() {
        List<BlizzardRatesResponse.HeroRate> rates = new ArrayList<>(CollectorFixtures.rates(3));
        rates.set(0, CollectorFixtures.rate("hero-0", "DAMAGE", "50", "10", null));

        assertThatCode(() -> validator.validate(rates)).doesNotThrowAnyException();
    }

    @Test
    void rejectsTooFewHeroes() {
        assertThatThrownBy(() -> validator.validate(CollectorFixtures.rates(2)))
                .isInstanceOf(InvalidSnapshotException.class).hasMessageContaining("at least 3");
        assertThatThrownBy(() -> validator.validate(List.of())).isInstanceOf(InvalidSnapshotException.class);
        assertThatThrownBy(() -> validator.validate(null)).isInstanceOf(InvalidSnapshotException.class);
    }

    @Test
    void rejectsPercentOutOfRange() {
        List<BlizzardRatesResponse.HeroRate> high = replaceFirst(CollectorFixtures.rate("hero-0", "TANK", "101", "10", "1"));
        List<BlizzardRatesResponse.HeroRate> negative = replaceFirst(CollectorFixtures.rate("hero-0", "TANK", "50", "-1", "1"));

        assertThatThrownBy(() -> validator.validate(high)).isInstanceOf(InvalidSnapshotException.class)
                .hasMessageContaining("winrate");
        assertThatThrownBy(() -> validator.validate(negative)).isInstanceOf(InvalidSnapshotException.class)
                .hasMessageContaining("pickrate");
    }

    @Test
    void rejectsUnknownRole() {
        List<BlizzardRatesResponse.HeroRate> rates = replaceFirst(CollectorFixtures.rate("hero-0", "WIZARD", "50", "10", "1"));

        assertThatThrownBy(() -> validator.validate(rates)).isInstanceOf(InvalidSnapshotException.class)
                .hasMessageContaining("role");
    }

    @Test
    void rejectsDuplicateHeroes() {
        List<BlizzardRatesResponse.HeroRate> rates = replaceFirst(CollectorFixtures.rate("hero-1", "TANK", "50", "10", "1"));

        assertThatThrownBy(() -> validator.validate(rates)).isInstanceOf(InvalidSnapshotException.class)
                .hasMessageContaining("Duplicate");
    }

    @Test
    void rejectsEntryWithoutCells() {
        List<BlizzardRatesResponse.HeroRate> rates = replaceFirst(new BlizzardRatesResponse.HeroRate("hero-0", null,
                new BlizzardRatesResponse.HeroInfo("Hero", "TANK", null)));

        assertThatThrownBy(() -> validator.validate(rates)).isInstanceOf(InvalidSnapshotException.class);
    }

    private List<BlizzardRatesResponse.HeroRate> replaceFirst(BlizzardRatesResponse.HeroRate replacement) {
        List<BlizzardRatesResponse.HeroRate> rates = new ArrayList<>(CollectorFixtures.rates(3));
        rates.set(0, replacement);
        return rates;
    }
}
