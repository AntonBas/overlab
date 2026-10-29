package gg.overlab.backend.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.hero.perk.PerkPosition;
import gg.overlab.backend.hero.perk.PerkRecommendation;
import gg.overlab.backend.hero.perk.PerkService;
import gg.overlab.backend.hero.perk.PerkSlot;
import gg.overlab.backend.hero.perk.dto.PerkDto;
import gg.overlab.backend.hero.perk.dto.PerkRequest;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

@IntegrationTest
@Transactional
class PerkPositionIntegrationTest {

    @Autowired
    private PerkService perkService;

    @Autowired
    private HeroRepository heroRepository;

    @BeforeEach
    void setUp() {
        Hero hero = new Hero();
        hero.setSlug("position-test");
        hero.setName("Position Test");
        hero.setRole(HeroRole.DAMAGE);
        heroRepository.save(hero);
    }

    private PerkRequest request(String name, PerkSlot slot, PerkPosition position) {
        return new PerkRequest("position-test", name, null, slot, position, PerkRecommendation.OPTIONAL, null);
    }

    @Test
    void listsPerksInGameOrderMinorLeftMinorRightMajorLeftMajorRight() {
        perkService.create(request("D", PerkSlot.MAJOR, PerkPosition.RIGHT));
        perkService.create(request("C", PerkSlot.MAJOR, PerkPosition.LEFT));
        perkService.create(request("B", PerkSlot.MINOR, PerkPosition.RIGHT));
        perkService.create(request("A", PerkSlot.MINOR, PerkPosition.LEFT));

        List<PerkDto> perks = perkService.findByHero("position-test");

        assertThat(perks).extracting(PerkDto::slot).containsExactly(
                PerkSlot.MAJOR, PerkSlot.MAJOR, PerkSlot.MINOR, PerkSlot.MINOR);
        assertThat(perks).extracting(PerkDto::position).containsExactly(
                PerkPosition.LEFT, PerkPosition.RIGHT, PerkPosition.LEFT, PerkPosition.RIGHT);
    }

    @Test
    void refusesASecondPerkInTheSameSlotAndPosition() {
        perkService.create(request("First", PerkSlot.MINOR, PerkPosition.LEFT));

        assertThatThrownBy(() -> perkService.create(request("Second", PerkSlot.MINOR, PerkPosition.LEFT)))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void refusesMovingAPerkOntoAnOccupiedPosition() {
        perkService.create(request("First", PerkSlot.MINOR, PerkPosition.LEFT));
        PerkDto second = perkService.create(request("Second", PerkSlot.MINOR, PerkPosition.RIGHT));

        assertThatThrownBy(() -> perkService.update(second.id(),
                request("Second", PerkSlot.MINOR, PerkPosition.LEFT))).isInstanceOf(ConflictException.class);
    }

    @Test
    void allowsKeepingThePositionOfThePerkBeingEdited() {
        PerkDto first = perkService.create(request("First", PerkSlot.MINOR, PerkPosition.LEFT));

        PerkDto updated = perkService.update(first.id(), request("Renamed", PerkSlot.MINOR, PerkPosition.LEFT));

        assertThat(updated.name()).isEqualTo("Renamed");
    }
}
