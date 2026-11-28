package gg.overlab.backend.collector.imports;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.collector.parser.ParsedAbility;
import gg.overlab.backend.hero.ability.AbilityControl;
import java.util.List;
import org.junit.jupiter.api.Test;

class SupplementalAbilitiesTest {

    private final SupplementalAbilities supplementalAbilities = new SupplementalAbilities();

    @Test
    void insertsAMissingAbilityAfterItsAnchorAndRenumbersTheList() {
        List<ParsedAbility> abilities = supplementalAbilities.complete("reaper",
                List.of(parsed("hellfire-shotguns", "Hellfire Shotguns", 0), parsed("shadow-step", "Shadow Step", 1)));

        assertThat(abilities).extracting(ParsedAbility::slug)
                .containsExactly("hellfire-shotguns", "dire-triggers", "shadow-step");
        assertThat(abilities).extracting(ParsedAbility::sortOrder).containsExactly(0, 1, 2);
        assertThat(abilities.get(1).defaultControl()).isEqualTo(AbilityControl.SECONDARY_FIRE);
        assertThat(abilities.get(1).supplemental()).isTrue();
    }

    @Test
    void placesAbilitiesWithoutAnAnchorFirstAndChainsThem() {
        List<ParsedAbility> abilities = supplementalAbilities.complete("mauga",
                List.of(parsed("overrun", "Overrun", 0)));

        assertThat(abilities).extracting(ParsedAbility::slug)
                .containsExactly("incendiary-chaingun", "volatile-chaingun", "overrun");
    }

    @Test
    void appendsAnAbilityWhoseAnchorIsGone() {
        List<ParsedAbility> abilities = supplementalAbilities.complete("emre",
                List.of(parsed("cyber-frag", "Cyber Frag", 0)));

        assertThat(abilities).extracting(ParsedAbility::slug).containsExactly("cyber-frag", "siphon-blaster");
    }

    @Test
    void prefersThePageOnceItListsTheAbilityUnderTheSameSlugOrName() {
        List<ParsedAbility> sameSlug = List.of(parsed("jagged-blade", "Serrated Blade", 0));
        List<ParsedAbility> sameName = List.of(parsed("blade", "Jagged Blade", 0));
        List<ParsedAbility> nameWithoutForm = List.of(parsed("block", "Block", 0),
                parsed("nemesis-form", "Nemesis Form", 1));

        assertThat(supplementalAbilities.complete("junker-queen", sameSlug)).isEqualTo(sameSlug);
        assertThat(supplementalAbilities.complete("junker-queen", sameName)).isEqualTo(sameName);
        assertThat(supplementalAbilities.complete("ramattra", nameWithoutForm)).isEqualTo(nameWithoutForm);
    }

    @Test
    void addsNothingWhenThePageYieldedNoAbilities() {
        assertThat(supplementalAbilities.complete("freja", List.of())).isEmpty();
    }

    @Test
    void leavesOtherHeroesUntouched() {
        List<ParsedAbility> parsedAbilities = List.of(parsed("biotic-rifle", "Biotic Rifle", 0));

        assertThat(supplementalAbilities.complete("ana", parsedAbilities)).isEqualTo(parsedAbilities);
    }

    private ParsedAbility parsed(String slug, String name, int sortOrder) {
        return new ParsedAbility(slug, name, "Text of " + name, null, sortOrder);
    }
}
