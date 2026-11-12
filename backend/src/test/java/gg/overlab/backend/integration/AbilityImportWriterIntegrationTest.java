package gg.overlab.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.collector.imports.AbilityImportWriter;
import gg.overlab.backend.collector.imports.ImportCounts;
import gg.overlab.backend.collector.parser.ParsedAbility;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.hero.ability.HeroAbility;
import gg.overlab.backend.hero.ability.HeroAbilityRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class AbilityImportWriterIntegrationTest {

    @Autowired
    private AbilityImportWriter writer;

    @Autowired
    private HeroRepository heroRepository;

    @Autowired
    private HeroAbilityRepository abilityRepository;

    private Hero hero;

    @BeforeEach
    void setUp() {
        Hero created = new Hero();
        created.setSlug("ability-test");
        created.setName("Ability Test");
        created.setRole(HeroRole.DAMAGE);
        hero = heroRepository.save(created);
    }

    @Test
    void removesAbilitiesThatBlizzardNoLongerListsAndKeepsTheRest() {
        writer.write("ability-test", List.of(parsed("old-gun", "Old Gun", 0), parsed("dash", "Dash", 1)),
                url -> Optional.empty());

        ImportCounts counts = writer.write("ability-test",
                List.of(parsed("dash", "Dash", 0), parsed("new-gun", "New Gun", 1)), url -> Optional.empty());

        assertThat(counts.removed()).isEqualTo(1);
        assertThat(counts.created()).isEqualTo(1);
        assertThat(abilityRepository.findAllByHeroSlugOrderBySortOrderAsc("ability-test"))
                .extracting(HeroAbility::getSlug).containsExactly("dash", "new-gun");
    }

    @Test
    void marksOnlyAbilitiesAddedAfterTheFirstImportAsIntroduced() {
        writer.write("ability-test", List.of(parsed("dash", "Dash", 0)), url -> Optional.empty());
        writer.write("ability-test", List.of(parsed("dash", "Dash", 0), parsed("new-gun", "New Gun", 1)),
                url -> Optional.empty());

        List<HeroAbility> abilities = abilityRepository.findAllByHeroSlugOrderBySortOrderAsc("ability-test");
        assertThat(abilities.get(0).getIntroducedAt()).isNull();
        assertThat(abilities.get(1).getIntroducedAt()).isNotNull();
    }

    @Test
    void removesNothingWhenThePageYieldedNoAbilities() {
        writer.write("ability-test", List.of(parsed("dash", "Dash", 0)), url -> Optional.empty());

        ImportCounts counts = writer.write("ability-test", List.of(), url -> Optional.empty());

        assertThat(counts.removed()).isZero();
        assertThat(abilityRepository.findAllByHeroSlugOrderBySortOrderAsc("ability-test")).hasSize(1);
    }

    private ParsedAbility parsed(String slug, String name, int sortOrder) {
        return new ParsedAbility(slug, name, "Text of " + name, null, sortOrder);
    }
}
