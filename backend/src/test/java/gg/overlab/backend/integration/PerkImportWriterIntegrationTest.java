package gg.overlab.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;

import gg.overlab.backend.collector.ParsedPerk;
import gg.overlab.backend.collector.PerkImportWriter;
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
        PerkImportWriter.Counts counts = writer.write("import-test", List.of(
                new ParsedPerk(PerkSlot.MINOR, PerkPosition.RIGHT, "Quick Dart", "Fires faster.", "https://cdn.example/q.png")),
                url -> Optional.of(PNG));

        assertThat(counts).isEqualTo(new PerkImportWriter.Counts(1, 0));
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

        PerkImportWriter.Counts counts = writer.write("import-test", List.of(
                new ParsedPerk(PerkSlot.MINOR, PerkPosition.RIGHT, "Quick Dart", "Blizzard text", null)), url -> Optional.empty());

        assertThat(counts).isEqualTo(new PerkImportWriter.Counts(0, 0));
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

        PerkImportWriter.Counts counts = writer.write("import-test", List.of(
                new ParsedPerk(PerkSlot.MINOR, PerkPosition.RIGHT, "Quick Dart", "Fires faster.", "https://cdn.example/q.png")),
                url -> Optional.of(PNG));

        assertThat(counts).isEqualTo(new PerkImportWriter.Counts(0, 1));
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
}
