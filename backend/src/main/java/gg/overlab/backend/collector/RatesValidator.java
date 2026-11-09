package gg.overlab.backend.collector;

import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.stats.GameQueue;
import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RatesValidator {

    private static final BigDecimal MAX_PERCENT = new BigDecimal("100");
    private static final BigDecimal NO_DATA_MARKER = BigDecimal.valueOf(-1);

    private final CollectorProperties properties;

    public void validate(List<BlizzardRatesResponse.HeroRate> rates) {
        if (rates == null || rates.size() < properties.minHeroes()) {
            throw new InvalidSnapshotException("Expected at least " + properties.minHeroes() + " heroes but got "
                    + (rates == null ? 0 : rates.size()));
        }
        Set<String> seen = new HashSet<>();
        for (BlizzardRatesResponse.HeroRate rate : rates) {
            validateHero(rate);
            if (!seen.add(rate.id())) {
                throw new InvalidSnapshotException("Duplicate hero in response: " + rate.id());
            }
            if (hasNoData(rate)) {
                continue;
            }
            validatePercent(rate.id(), "winrate", rate.cells().winrate(), false);
            validatePercent(rate.id(), "pickrate", rate.cells().pickrate(), false);
            validatePercent(rate.id(), "banrate", rate.cells().banrate(), true);
        }
    }

    public List<BlizzardRatesResponse.HeroRate> withoutEmptyEntries(List<BlizzardRatesResponse.HeroRate> rates) {
        return rates.stream().filter(rate -> !hasNoData(rate)).toList();
    }

    public void validateBanRates(GameQueue queue, List<BlizzardRatesResponse.HeroRate> rates) {
        if (queue != GameQueue.COMPETITIVE) {
            return;
        }
        for (BlizzardRatesResponse.HeroRate rate : rates) {
            if (rate.cells().banrate() == null) {
                throw new InvalidSnapshotException("banrate is missing for " + rate.id());
            }
        }
    }

    private boolean hasNoData(BlizzardRatesResponse.HeroRate rate) {
        BigDecimal winRate = rate.cells().winrate();
        return winRate != null && winRate.compareTo(NO_DATA_MARKER) == 0;
    }

    private void validateHero(BlizzardRatesResponse.HeroRate rate) {
        if (rate == null || rate.id() == null || rate.id().isBlank() || rate.cells() == null || rate.hero() == null
                || rate.hero().name() == null || rate.hero().name().isBlank()) {
            throw new InvalidSnapshotException("Hero entry is missing required fields");
        }
        try {
            HeroRole.valueOf(String.valueOf(rate.hero().role()).toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new InvalidSnapshotException("Unknown role for " + rate.id() + ": " + rate.hero().role());
        }
    }

    private void validatePercent(String heroId, String field, BigDecimal value, boolean optional) {
        if (value == null) {
            if (optional) {
                return;
            }
            throw new InvalidSnapshotException(field + " is missing for " + heroId);
        }
        if (value.signum() < 0 || value.compareTo(MAX_PERCENT) > 0) {
            throw new InvalidSnapshotException(field + " out of range for " + heroId + ": " + value);
        }
    }
}
