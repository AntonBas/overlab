package gg.overlab.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.collector.imports.ImportCounts;
import gg.overlab.backend.collector.imports.PerkImportWriter;
import gg.overlab.backend.collector.parser.ParsedPerk;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.hero.perk.Perk;
import gg.overlab.backend.hero.perk.PerkPosition;
import gg.overlab.backend.hero.perk.PerkRecommendation;
import gg.overlab.backend.hero.perk.PerkRepository;
import gg.overlab.backend.hero.perk.PerkSlot;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class PerkImportWriterIntegrationTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 13, 10, 26, 10, 7, 7, 7};

    @Autowired
    private PerkImportWriter writer;

    @Autowired
    private HeroRepository heroRepository;

    @Autowired
    private PerkRepository perkRepository;

    private Hero hero;

    @BeforeEach
    void setUp() {
        Hero created = new Hero();
        created.setSlug("import-test");
        created.setName("Import Test");
        created.setRole(HeroRole.SUPPORT);
        hero = heroRepository.save(created);
    }

    @Test
    void createsNewPerksWithAnIconAndANeutralRecommendation() {
        ImportCounts counts = writer.write("import-test", List.of(
                new ParsedPerk(PerkSlot.MINOR, PerkPosition.RIGHT, "Quick Dart", "Fires faster.", "https://cdn.example/q.png")),
                url -> Optional.of(PNG));

        assertThat(counts).isEqualTo(new ImportCounts(1, 0));
        Perk perk = perkRepository.findByHeroIdAndNameIgnoreCase(hero.getId(), "quick dart").orElseThrow();
        assertThat(perk.getSlot()).isEqualTo(PerkSlot.MINOR);
        assertThat(perk.getPosition()).isEqualTo(PerkPosition.RIGHT);
        assertThat(perk.getRecommendation()).isEqualTo(PerkRecommendation.OPTIONAL);
        assertThat(perk.getDescription()).isEqualTo("Fires faster.");
        assertThat(perk.getIconUrl()).startsWith("perks/perk-" + perk.getId() + "-").endsWith(".png");
    }

    @Test
    void keepsTheCuratedFieldsOfAnExistingPerk() {
        Perk existing = new Perk();
        existing.setHero(hero);
        existing.setName("Quick Dart");
        existing.setSlot(PerkSlot.MAJOR);
        existing.setRecommendation(PerkRecommendation.RECOMMENDED);
        existing.setRecommendationNote("Always take it");
        existing.setDescription("Own text");
        perkRepository.saveAndFlush(existing);

        ImportCounts counts = writer.write("import-test", List.of(
                new ParsedPerk(PerkSlot.MINOR, PerkPosition.RIGHT, "Quick Dart", "Blizzard text", null)), url -> Optional.empty());

        assertThat(counts).isEqualTo(new ImportCounts(0, 0));
        Perk reloaded = perkRepository.findById(existing.getId()).orElseThrow();
        assertThat(reloaded.getRecommendation()).isEqualTo(PerkRecommendation.RECOMMENDED);
        assertThat(reloaded.getRecommendationNote()).isEqualTo("Always take it");
        assertThat(reloaded.getDescription()).isEqualTo("Own text");
        assertThat(reloaded.getSlot()).isEqualTo(PerkSlot.MAJOR);
    }

    @Test
    void fillsAMissingDescriptionAndIconOfAnExistingPerk() {
        Perk existing = new Perk();
        existing.setHero(hero);
        existing.setName("Quick Dart");
        existing.setSlot(PerkSlot.MINOR);
        existing.setRecommendation(PerkRecommendation.OPTIONAL);
        perkRepository.saveAndFlush(existing);

        ImportCounts counts = writer.write("import-test", List.of(
                new ParsedPerk(PerkSlot.MINOR, PerkPosition.RIGHT, "Quick Dart", "Fires faster.", "https://cdn.example/q.png")),
                url -> Optional.of(PNG));

        assertThat(counts).isEqualTo(new ImportCounts(0, 1));
        Perk reloaded = perkRepository.findById(existing.getId()).orElseThrow();
        assertThat(reloaded.getDescription()).isEqualTo("Fires faster.");
        assertThat(reloaded.getIconUrl()).isNotNull();
    }

    @Test
    void doesNotDownloadTheIconAgainWhenOneIsAlreadySet() {
        Perk existing = new Perk();
        existing.setHero(hero);
        existing.setName("Quick Dart");
        existing.setSlot(PerkSlot.MINOR);
        existing.setRecommendation(PerkRecommendation.OPTIONAL);
        existing.setIconUrl("perks/own.png");
        perkRepository.saveAndFlush(existing);

        writer.write("import-test", List.of(
                new ParsedPerk(PerkSlot.MINOR, PerkPosition.RIGHT, "Quick Dart", null, "https://cdn.example/q.png")),
                url -> {
                    throw new AssertionError("The icon must not be downloaded");
                });

        assertThat(perkRepository.findById(existing.getId()).orElseThrow().getIconUrl()).isEqualTo("perks/own.png");
    }

    private Perk importedPerk(String name, String description) {
        Perk perk = new Perk();
        perk.setHero(hero);
        perk.setName(name);
        perk.setSlot(PerkSlot.MINOR);
        perk.setRecommendation(PerkRecommendation.RECOMMENDED);
        perk.setDescription(description);
        perk.setImported(true);
        perk.setImportedDescription(description);
        return perkRepository.saveAndFlush(perk);
    }

    private ParsedPerk parsed(PerkSlot slot, String name, String description) {
        return new ParsedPerk(slot, PerkPosition.LEFT, name, description, null);
    }

    @Test
    void marksAPerkAddedToAHeroThatAlreadyHadPerksAsIntroduced() {
        importedPerk("Quick Dart", "Text");

        writer.write("import-test", List.of(parsed(PerkSlot.MINOR, "Quick Dart", "Text"),
                parsed(PerkSlot.MAJOR, "Brand New", "Fresh")), url -> Optional.empty());

        assertThat(perkRepository.findByHeroIdAndNameIgnoreCase(hero.getId(), "Brand New").orElseThrow()
                .getIntroducedAt()).isNotNull();
        assertThat(perkRepository.findByHeroIdAndNameIgnoreCase(hero.getId(), "Quick Dart").orElseThrow()
                .getIntroducedAt()).isNull();
    }

    @Test
    void doesNotMarkTheFirstImportOfAHeroAsNew() {
        writer.write("import-test", List.of(parsed(PerkSlot.MINOR, "Quick Dart", "Text")),
                url -> Optional.empty());

        assertThat(perkRepository.findByHeroIdAndNameIgnoreCase(hero.getId(), "Quick Dart").orElseThrow()
                .getIntroducedAt()).isNull();
    }

    @Test
    void updatesTheTextOfAnImportedPerkWhenBlizzardChangesIt() {
        Perk existing = importedPerk("Quick Dart", "Old text");

        ImportCounts counts = writer.write("import-test",
                List.of(parsed(PerkSlot.MINOR, "Quick Dart", "New text")), url -> Optional.empty());

        assertThat(counts).isEqualTo(new ImportCounts(0, 1));
        Perk reloaded = perkRepository.findById(existing.getId()).orElseThrow();
        assertThat(reloaded.getDescription()).isEqualTo("New text");
        assertThat(reloaded.getImportedDescription()).isEqualTo("New text");
        assertThat(reloaded.getRecommendation()).isEqualTo(PerkRecommendation.RECOMMENDED);
    }

    @Test
    void keepsTheTextAnEditorWroteButRemembersWhatBlizzardSaid() {
        Perk existing = importedPerk("Quick Dart", "Old text");
        existing.setDescription("Edited by hand");
        perkRepository.saveAndFlush(existing);

        writer.write("import-test", List.of(parsed(PerkSlot.MINOR, "Quick Dart", "New text")),
                url -> Optional.empty());

        Perk reloaded = perkRepository.findById(existing.getId()).orElseThrow();
        assertThat(reloaded.getDescription()).isEqualTo("Edited by hand");
        assertThat(reloaded.getImportedDescription()).isEqualTo("New text");
    }

    @Test
    void movesAnImportedPerkToTheNewSlot() {
        Perk existing = importedPerk("Quick Dart", "Text");

        writer.write("import-test", List.of(parsed(PerkSlot.MAJOR, "Quick Dart", "Text")), url -> Optional.empty());

        assertThat(perkRepository.findById(existing.getId()).orElseThrow().getSlot()).isEqualTo(PerkSlot.MAJOR);
    }

    @Test
    void removesImportedPerksThatBlizzardNoLongerListsButKeepsManualOnes() {
        Perk gone = importedPerk("Old Perk", "Text");
        importedPerk("Quick Dart", "Text");
        Perk manual = new Perk();
        manual.setHero(hero);
        manual.setName("Manual Perk");
        manual.setSlot(PerkSlot.MINOR);
        manual.setRecommendation(PerkRecommendation.OPTIONAL);
        perkRepository.saveAndFlush(manual);

        ImportCounts counts = writer.write("import-test",
                List.of(parsed(PerkSlot.MINOR, "Quick Dart", "Text")), url -> Optional.empty());

        assertThat(counts).isEqualTo(new ImportCounts(0, 0, 1));
        assertThat(perkRepository.findById(gone.getId())).isEmpty();
        assertThat(perkRepository.findById(manual.getId())).isPresent();
    }

    @Test
    void removesNothingWhenThePageYieldedNoPerks() {
        Perk existing = importedPerk("Quick Dart", "Text");

        ImportCounts counts = writer.write("import-test", List.of(), url -> Optional.empty());

        assertThat(counts).isEqualTo(new ImportCounts(0, 0, 0));
        assertThat(perkRepository.findById(existing.getId())).isPresent();
    }
}
