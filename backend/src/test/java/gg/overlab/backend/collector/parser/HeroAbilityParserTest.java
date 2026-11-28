package gg.overlab.backend.collector.parser;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

public class HeroAbilityParserTest {

    public static final String PAGE = """
            <html><body>
            <blz-carousel-section>
              <blz-header slot="header"><h2 slot="heading">Abilities</h2></blz-header>
              <blz-carousel slot="carousel">
                <blz-tab-controls slot="control">
                  <blz-tab-control id="fire-strike" label="Fire Strike"><span class="ability-name">Fire Strike</span>
                    <blz-image slot="icon" src="https://cdn.example/fire.png"></blz-image></blz-tab-control>
                  <blz-tab-control id="barrier-field" label="Barrier Field"><span class="ability-name">Barrier Field</span>
                    <blz-image slot="icon" src="https://cdn.example/barrier.png"></blz-image></blz-tab-control>
                  <blz-tab-control id="charge" label="Charge"><span class="ability-name">Charge</span></blz-tab-control>
                </blz-tab-controls>
                <blz-feature slot="slide"><blz-header slot="header">
                  <h3 class="heading" slot="heading">Fire Strike</h3>
                  <p slot="description">Launch a fiery projectile.</p></blz-header></blz-feature>
                <blz-feature slot="slide"><blz-header slot="header">
                  <h3 class="heading" slot="heading">Barrier Field</h3>
                  <p slot="description">Hold <img src='https://static.example/mouse.png' alt='overwatch.page.herodetail.ability.secondary-fire'/> to deploy a frontal energy barrier.</p></blz-header></blz-feature>
              </blz-carousel>
            </blz-carousel-section>
            <blz-carousel-section>
              <blz-header slot="header"><h2 slot="heading">Other</h2></blz-header>
              <blz-tab-control id="ignored" label="Ignored"></blz-tab-control>
            </blz-carousel-section>
            </body></html>
            """;

    private final HeroAbilityParser parser = new HeroAbilityParser();

    @Test
    void readsSlugNameDescriptionIconAndOrderOfEveryAbility() {
        List<ParsedAbility> abilities = parser.parse(PAGE);

        assertThat(abilities).extracting(ParsedAbility::slug).containsExactly("fire-strike", "barrier-field", "charge");
        assertThat(abilities).extracting(ParsedAbility::sortOrder).containsExactly(0, 1, 2);
        assertThat(abilities.get(0).name()).isEqualTo("Fire Strike");
        assertThat(abilities.get(0).description()).isEqualTo("Launch a fiery projectile.");
        assertThat(abilities.get(0).iconUrl()).isEqualTo("https://cdn.example/fire.png");
    }

    @Test
    void replacesKeyIconsWithTheirNameInTheDescription() {
        assertThat(parser.parse(PAGE).get(1).description())
                .isEqualTo("Hold secondary fire to deploy a frontal energy barrier.");
    }

    @Test
    void abilityWithoutDescriptionOrIconKeepsNullFields() {
        ParsedAbility charge = parser.parse(PAGE).get(2);

        assertThat(charge.description()).isNull();
        assertThat(charge.iconUrl()).isNull();
    }

    @Test
    void pageWithoutAbilitiesSectionYieldsNothing() {
        assertThat(parser.parse("<html><body><p>nothing</p></body></html>")).isEmpty();
    }
}
