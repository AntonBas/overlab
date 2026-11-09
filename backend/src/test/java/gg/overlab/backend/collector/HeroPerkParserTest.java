package gg.overlab.backend.collector;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.hero.perk.PerkPosition;
import gg.overlab.backend.hero.perk.PerkSlot;
import java.util.List;
import org.junit.jupiter.api.Test;

class HeroPerkParserTest {

    static final String PAGE = """
            <html><body>
            <div class="perk-category minor">
              <blz-header slot="header"><h4 slot="subheading">Minor Perk</h4></blz-header>
              <div class="perks">
                <div class="perk-details left minor 1">
                  <div class="perk-icon-wrapper"><div class="perk-icon perk-details-icon">
                    <img alt="Quick Dart" src="https://cdn.example/quick.png"/></div></div>
                  <div class="perk-info active"><blz-header slot="header">
                    <h3 slot="subheading">Quick Dart</h3>
                    <div slot="description">Fires faster.</div></blz-header></div>
                </div>
                <div class="perk-details right minor 2">
                  <div class="perk-icon-wrapper"><div class="perk-icon perk-details-icon">
                    <img alt="Long Dart" src="https://cdn.example/long.png"/></div></div>
                  <div class="perk-info"><blz-header slot="header">
                    <h3 slot="subheading">Long Dart</h3></blz-header></div>
                </div>
              </div>
            </div>
            <div class="perk-category major">
              <div class="perks">
                <div class="perk-details left major 3">
                  <div class="perk-info"><blz-header slot="header">
                    <h3 slot="subheading">Big Dart</h3>
                    <div slot="description">Hits harder.</div></blz-header></div>
                </div>
              </div>
            </div>
            <div class="perk-category unknown"><div class="perk-details"><h3 slot="subheading">Ignored</h3></div></div>
            </body></html>
            """;

    private final HeroPerkParser parser = new HeroPerkParser();

    @Test
    void readsSlotNameDescriptionAndIconOfEveryPerk() {
        List<ParsedPerk> perks = parser.parse(PAGE);

        assertThat(perks).containsExactly(
                new ParsedPerk(PerkSlot.MINOR, PerkPosition.LEFT, "Quick Dart", "Fires faster.", "https://cdn.example/quick.png"),
                new ParsedPerk(PerkSlot.MINOR, PerkPosition.RIGHT, "Long Dart", null, "https://cdn.example/long.png"),
                new ParsedPerk(PerkSlot.MAJOR, PerkPosition.LEFT, "Big Dart", "Hits harder.", null));
    }

    @Test
    void pageWithoutPerksGivesAnEmptyList() {
        assertThat(parser.parse("<html><body><h1>Hero</h1></body></html>")).isEmpty();
    }
}
