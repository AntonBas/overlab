package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.Test;

class BlizzardResponseContractTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RatesValidator validator = new RatesValidator(CollectorFixtures.properties(1));

    @Test
    void expectedResponseShapeParsesAndPassesValidation() throws Exception {
        List<BlizzardRatesResponse.HeroRate> rates = parse(heroes(40, "winrate", "pickrate"));

        assertThat(rates).hasSize(40);
        validator.validate(rates);
    }

    @Test
    void renamedRateFieldIsRejectedInsteadOfStoredAsZero() throws Exception {
        List<BlizzardRatesResponse.HeroRate> rates = parse(heroes(40, "win_rate", "pickrate"));

        assertThatThrownBy(() -> validator.validate(rates))
                .isInstanceOf(InvalidSnapshotException.class)
                .hasMessageContaining("winrate is missing");
    }

    @Test
    void renamedHeroBlockIsRejected() throws Exception {
        String json = heroes(40, "winrate", "pickrate").replace("\"hero\"", "\"heroInfo\"");
        List<BlizzardRatesResponse.HeroRate> rates = parse(json);

        assertThatThrownBy(() -> validator.validate(rates)).isInstanceOf(InvalidSnapshotException.class);
    }

    @Test
    void unknownRoleIsRejected() throws Exception {
        String json = heroes(40, "winrate", "pickrate").replace("\"TANK\"", "\"HEALER\"");
        List<BlizzardRatesResponse.HeroRate> rates = parse(json);

        assertThatThrownBy(() -> validator.validate(rates))
                .isInstanceOf(InvalidSnapshotException.class)
                .hasMessageContaining("Unknown role");
    }

    private List<BlizzardRatesResponse.HeroRate> parse(String json) throws Exception {
        return objectMapper.readValue(json, BlizzardRatesResponse.class).rates().rates();
    }

    private String heroes(int count, String winRateField, String pickRateField) {
        StringBuilder entries = new StringBuilder();
        for (int index = 0; index < count; index++) {
            if (index > 0) {
                entries.append(',');
            }
            entries.append("{\"id\":\"hero-").append(index).append("\",\"cells\":{\"name\":\"Hero ").append(index)
                    .append("\",\"").append(winRateField).append("\":50.0,\"").append(pickRateField)
                    .append("\":10.0,\"banrate\":2.0},\"hero\":{\"name\":\"Hero ").append(index)
                    .append("\",\"role\":\"TANK\",\"subrole\":\"initiator\"}}");
        }
        return "{\"rates\":{\"rates\":[" + entries + "]}}";
    }
}
