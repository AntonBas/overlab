package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.gamemap.MapMode;
import java.util.List;
import org.junit.jupiter.api.Test;

class MapListParserTest {

    private static final String PAGE = """
            <select id="filter-role-select"><option value="all">All</option></select>
            <select id="filter-map-select">
              <option value="all-maps">All Maps</option>
              <optgroup label="Control">
                <option value="busan">Busan</option>
                <option value="ilios">Ilios</option>
              </optgroup>
              <optgroup label="Escort">
                <option value="circuit-royal">Circuit royal</option>
              </optgroup>
              <optgroup label="Brand New Mode">
                <option value="mystery-map">Mystery Map</option>
              </optgroup>
            </select>
            """;

    private final MapListParser parser = new MapListParser();

    @Test
    void readsEveryMapWithItsModeAndSkipsTheAllMapsEntry() {
        List<ParsedMap> maps = parser.parse(PAGE);

        assertThat(maps).extracting(ParsedMap::slug)
                .containsExactly("busan", "ilios", "circuit-royal", "mystery-map");
        assertThat(maps.get(0).mode()).isEqualTo(MapMode.CONTROL);
        assertThat(maps.get(2).name()).isEqualTo("Circuit royal");
        assertThat(maps.get(2).mode()).isEqualTo(MapMode.ESCORT);
    }

    @Test
    void leavesTheModeEmptyForAnUnknownGroup() {
        assertThat(parser.parse(PAGE).get(3).mode()).isNull();
    }

    @Test
    void returnsNothingWhenThePageHasNoMapSelect() {
        assertThat(parser.parse("<html><body>Maintenance</body></html>")).isEmpty();
    }
}
