package gg.overlab.backend.hero.ability;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.ability.dto.AbilityAdminDto;
import gg.overlab.backend.hero.ability.dto.AbilityControlRequest;
import gg.overlab.backend.media.MediaUrlResolver;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class AbilityServiceTest {

    private final HeroAbilityRepository abilityRepository = mock(HeroAbilityRepository.class);
    private final HeroRepository heroRepository = mock(HeroRepository.class);
    private final AuditService auditService = mock(AuditService.class);
    private final MediaUrlResolver mediaUrlResolver = mock(MediaUrlResolver.class);
    private final AbilityService service = new AbilityService(abilityRepository, heroRepository,
            new AbilityMapper(mediaUrlResolver), auditService);

    private HeroAbility ability(long id, String name, AbilityControl control) {
        Hero hero = new Hero();
        hero.setSlug("reinhardt");
        HeroAbility ability = new HeroAbility();
        ability.setId(id);
        ability.setHero(hero);
        ability.setSlug(name.toLowerCase());
        ability.setName(name);
        ability.setControl(control);
        return ability;
    }

    @Test
    void listsTheAbilitiesOfAHeroForTheAdmin() {
        when(heroRepository.findBySlug("reinhardt")).thenReturn(Optional.of(new Hero()));
        when(abilityRepository.findAllByHeroSlugOrderBySortOrderAsc("reinhardt")).thenReturn(List.of(
                ability(1, "Charge", AbilityControl.ABILITY_1), ability(2, "Earthshatter", null)));

        List<AbilityAdminDto> result = service.findForAdmin("reinhardt");

        assertThat(result).extracting(AbilityAdminDto::name).containsExactly("Charge", "Earthshatter");
        assertThat(result.get(1).control()).isNull();
    }

    @Test
    void listingAnUnknownHeroFails() {
        when(heroRepository.findBySlug("nobody")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findForAdmin("nobody")).isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void updatesTheControlAndWritesAnAuditEntry() {
        HeroAbility charge = ability(1, "Charge", null);
        when(abilityRepository.findById(1L)).thenReturn(Optional.of(charge));

        AbilityAdminDto result = service.updateControl(1L, new AbilityControlRequest(AbilityControl.ABILITY_1));

        assertThat(result.control()).isEqualTo(AbilityControl.ABILITY_1);
        assertThat(charge.getControl()).isEqualTo(AbilityControl.ABILITY_1);
        verify(auditService).logUpdate(any(), any(), any(), any());
    }

    @Test
    void clearsTheControlWhenNoneIsGiven() {
        HeroAbility charge = ability(1, "Charge", AbilityControl.ABILITY_1);
        when(abilityRepository.findById(1L)).thenReturn(Optional.of(charge));

        service.updateControl(1L, new AbilityControlRequest(null));

        assertThat(charge.getControl()).isNull();
    }

    @Test
    void updatingAnUnknownAbilityFails() {
        when(abilityRepository.findById(9L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateControl(9L, new AbilityControlRequest(null)))
                .isInstanceOf(EntityNotFoundException.class);
    }
}
