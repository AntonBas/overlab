package gg.overlab.backend.content;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.hero.relation.HeroRelation;
import gg.overlab.backend.hero.relation.HeroRelationRepository;
import gg.overlab.backend.hero.relation.HeroRelationService;
import gg.overlab.backend.hero.relation.RelationType;
import gg.overlab.backend.hero.relation.dto.HeroCountersDto;
import gg.overlab.backend.hero.relation.dto.HeroRelationsDto;
import gg.overlab.backend.hero.relation.dto.RelatedHeroDto;
import gg.overlab.backend.media.MediaUrlResolver;
import gg.overlab.backend.hero.relation.dto.RelationRequest;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class HeroRelationServiceTest {

    private final HeroRelationRepository relationRepository = mock(HeroRelationRepository.class);
    private final HeroRepository heroRepository = mock(HeroRepository.class);
    private final HeroRelationService service = new HeroRelationService(relationRepository, heroRepository,
            mock(AuditService.class), mock(MediaUrlResolver.class));

    private final Hero ana = hero(1, "ana", "Ana", HeroRole.SUPPORT);
    private final Hero genji = hero(2, "genji", "Genji", HeroRole.DAMAGE);
    private final Hero reinhardt = hero(3, "reinhardt", "Reinhardt", HeroRole.TANK);

    @BeforeEach
    void stubHeroes() {
        when(heroRepository.findBySlug("ana")).thenReturn(Optional.of(ana));
        when(heroRepository.findBySlug("genji")).thenReturn(Optional.of(genji));
        when(heroRepository.findBySlug("reinhardt")).thenReturn(Optional.of(reinhardt));
        when(relationRepository.save(any(HeroRelation.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void countersListBothDirectionsSortedByStrength() {
        when(relationRepository.findAllByHeroSlugAndType("ana", RelationType.COUNTER)).thenReturn(List.of(
                relation(ana, genji, RelationType.COUNTER, 1), relation(ana, reinhardt, RelationType.COUNTER, 3)));
        when(relationRepository.findAllByRelatedHeroSlugAndType("ana", RelationType.COUNTER))
                .thenReturn(List.of(relation(genji, ana, RelationType.COUNTER, 2)));

        HeroCountersDto result = service.getCounters("ana");

        assertThat(result.counters()).extracting(RelatedHeroDto::slug).containsExactly("reinhardt", "genji");
        assertThat(result.counteredBy()).extracting(RelatedHeroDto::slug).containsExactly("genji");
    }

    @Test
    void synergiesMergeBothSidesKeepingTheStrongerEntry() {
        when(relationRepository.findAllByHeroSlugAndType("ana", RelationType.SYNERGY))
                .thenReturn(List.of(relation(ana, reinhardt, RelationType.SYNERGY, 1)));
        when(relationRepository.findAllByRelatedHeroSlugAndType("ana", RelationType.SYNERGY)).thenReturn(List.of(
                relation(reinhardt, ana, RelationType.SYNERGY, 3), relation(genji, ana, RelationType.SYNERGY, 2)));

        List<RelatedHeroDto> result = service.getSynergies("ana");

        assertThat(result).extracting(RelatedHeroDto::slug).containsExactly("reinhardt", "genji");
        assertThat(result.get(0).strength()).isEqualTo(3);
    }

    @Test
    void allRelationsGroupCountersAndSynergiesPerHero() {
        when(heroRepository.findAllByActiveTrueOrderByNameAsc()).thenReturn(List.of(ana, genji, reinhardt));
        when(relationRepository.findAllByOrderByIdAsc()).thenReturn(List.of(
                relation(ana, genji, RelationType.COUNTER, 1), relation(ana, reinhardt, RelationType.COUNTER, 3),
                relation(genji, ana, RelationType.COUNTER, 2), relation(ana, reinhardt, RelationType.SYNERGY, 2),
                relation(reinhardt, ana, RelationType.SYNERGY, 3)));

        List<HeroRelationsDto> result = service.findAllRelations();

        assertThat(result).extracting(HeroRelationsDto::heroSlug).containsExactly("ana", "genji", "reinhardt");
        HeroRelationsDto forAna = result.get(0);
        assertThat(forAna.counters()).extracting(RelatedHeroDto::slug).containsExactly("reinhardt", "genji");
        assertThat(forAna.counteredBy()).extracting(RelatedHeroDto::slug).containsExactly("genji");
        assertThat(forAna.synergies()).extracting(RelatedHeroDto::slug).containsExactly("reinhardt");
        assertThat(forAna.synergies().get(0).strength()).isEqualTo(3);
        assertThat(result.get(2).counteredBy()).extracting(RelatedHeroDto::slug).containsExactly("ana");
        assertThat(result.get(2).synergies()).extracting(RelatedHeroDto::slug).containsExactly("ana");
    }

    @Test
    void unknownHeroIsNotFound() {
        when(heroRepository.findBySlug("nobody")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getCounters("nobody")).isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void rejectsRelationWithItself() {
        assertThatThrownBy(() -> service.create(new RelationRequest("ana", "ana", RelationType.COUNTER, 2, null)))
                .isInstanceOf(BadRequestException.class);
        verify(relationRepository, never()).save(any());
    }

    @Test
    void rejectsDuplicateInEitherDirection() {
        when(relationRepository.existsByHeroIdAndRelatedHeroIdAndTypeAndIdNot(2L, 1L, RelationType.SYNERGY, -1L))
                .thenReturn(true);

        assertThatThrownBy(() -> service.create(new RelationRequest("ana", "genji", RelationType.SYNERGY, 2, null)))
                .isInstanceOf(ConflictException.class);
        verify(relationRepository, never()).save(any());
    }

    @Test
    void createsRelationWhenNoDuplicateExists() {
        var created = service.create(new RelationRequest("ana", "genji", RelationType.COUNTER, 3, "Sleep dart"));

        assertThat(created.heroSlug()).isEqualTo("ana");
        assertThat(created.relatedHeroSlug()).isEqualTo("genji");
        assertThat(created.strength()).isEqualTo(3);
        assertThat(created.note()).isEqualTo("Sleep dart");
    }

    private Hero hero(long id, String slug, String name, HeroRole role) {
        Hero hero = new Hero();
        hero.setId(id);
        hero.setSlug(slug);
        hero.setName(name);
        hero.setRole(role);
        return hero;
    }

    private HeroRelation relation(Hero hero, Hero related, RelationType type, int strength) {
        HeroRelation relation = new HeroRelation();
        relation.setHero(hero);
        relation.setRelatedHero(related);
        relation.setType(type);
        relation.setStrength((short) strength);
        return relation;
    }
}
