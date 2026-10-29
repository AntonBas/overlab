package gg.overlab.backend.collector;

import java.util.List;

public record RatesFetch(List<BlizzardRatesResponse.HeroRate> rates, String etag, boolean notModified) {

    public static RatesFetch unchanged() {
        return new RatesFetch(List.of(), null, true);
    }
}
