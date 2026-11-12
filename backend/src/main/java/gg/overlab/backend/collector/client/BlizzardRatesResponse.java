package gg.overlab.backend.collector.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record BlizzardRatesResponse(RatesPayload rates, List<Column> columns) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Column(String id) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record RatesPayload(List<HeroRate> rates) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record HeroRate(String id, Cells cells, HeroInfo hero) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Cells(String name, BigDecimal winrate, BigDecimal pickrate, BigDecimal banrate) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record HeroInfo(String name, String role, String subrole, String portrait, String roleIcon) {
    }
}
