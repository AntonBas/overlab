package gg.overlab.backend.content;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.HeroRole;
import gg.overlab.backend.hero.category.CategoryMatchupType;
import gg.overlab.backend.hero.category.HeroCategory;
import gg.overlab.backend.hero.category.HeroCategoryRelation;
import gg.overlab.backend.hero.category.HeroCategoryRelationRepository;
import gg.overlab.backend.hero.category.HeroCategoryRepository;
import gg.overlab.backend.hero.category.HeroCategoryService;
import gg.overlab.backend.hero.category.dto.CategoryAdminDto;
import gg.overlab.backend.hero.category.dto.CategoryMatchupAdminDto;
import gg.overlab.backend.hero.category.dto.CategoryMatchupRequest;
import gg.overlab.backend.hero.category.dto.CategoryMemberDto;
import gg.overlab.backend.hero.category.dto.CategoryRequest;
import gg.overlab.backend.hero.category.dto.HeroCategoriesDto;
import gg.overlab.backend.media.MediaUrlResolver;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class HeroCategoryServiceTest {

    private final HeroCategoryRepository categoryRepository = mock(HeroCategoryRepository.class);
    private final HeroCategoryRelationRepository relationRepository = mock(HeroCategoryRelationRepository.class);
    private final HeroRepository heroRepository = mock(HeroRepository.class);
    private final HeroCategoryService service = new HeroCategoryService(categoryRepository, relationRepository,
            heroRepository, mock(AuditService.class), mock(MediaUrlResolver.class));

    @Test
    void categoriesListActiveMembersByRoleThenName() {
        Hero zarya = hero("zarya", "Zarya", HeroRole.TANK, true);
        Hero symmetra = hero("symmetra", "Symmetra", HeroRole.DAMAGE, true);
        Hero moira = hero("moira", "Moira", HeroRole.SUPPORT, true);
        Hero retired = hero("retired", "Retired", HeroRole.DAMAGE, false);
        HeroCategory beam = category("beam", "Beam", moira, retired, symmetra, zarya);
        when(categoryRepository.findAllByOrderByNameAsc()).thenReturn(List.of(beam));
        when(relationRepository.findAllByOrderByIdAsc()).thenReturn(List.of());

        HeroCategoriesDto result = service.findAll();

        assertThat(result.categories()).hasSize(1);
        assertThat(result.categories().get(0).heroes()).extracting(CategoryMemberDto::slug)
                .containsExactly("zarya", "symmetra", "moira");
    }

    @Test
    void matchupsCarryTypeAndNote() {
        Hero pharah = hero("pharah", "Pharah", HeroRole.DAMAGE, true);
        HeroCategory hitscan = category("hitscan", "Hitscan");
        HeroCategoryRelation relation = new HeroCategoryRelation();
        relation.setHero(pharah);
        relation.setCategory(hitscan);
        relation.setType(CategoryMatchupType.WEAK_AGAINST);
        relation.setNote("Shot down without leading");
        when(categoryRepository.findAllByOrderByNameAsc()).thenReturn(List.of(hitscan));
        when(relationRepository.findAllByOrderByIdAsc()).thenReturn(List.of(relation));

        HeroCategoriesDto result = service.findAll();

        assertThat(result.matchups()).singleElement().satisfies(matchup -> {
            assertThat(matchup.heroSlug()).isEqualTo("pharah");
            assertThat(matchup.categorySlug()).isEqualTo("hitscan");
            assertThat(matchup.type()).isEqualTo(CategoryMatchupType.WEAK_AGAINST);
            assertThat(matchup.note()).isEqualTo("Shot down without leading");
        });
    }

    @Test
    void creatingACategorySavesItsMembers() {
        Hero zarya = hero("zarya", "Zarya", HeroRole.TANK, true);
        when(categoryRepository.existsBySlugAndIdNot("beam", -1L)).thenReturn(false);
        when(heroRepository.findAllBySlugIn(any())).thenReturn(List.of(zarya));
        when(categoryRepository.save(any(HeroCategory.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CategoryAdminDto created = service.createCategory(new CategoryRequest("beam", "Beam", null, List.of("zarya")));

        assertThat(created.slug()).isEqualTo("beam");
        assertThat(created.heroSlugs()).containsExactly("zarya");
    }

    @Test
    void duplicateCategorySlugIsAConflict() {
        when(categoryRepository.existsBySlugAndIdNot("beam", -1L)).thenReturn(true);

        assertThatThrownBy(() -> service.createCategory(new CategoryRequest("beam", "Beam", null, List.of())))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void unknownMemberHeroIsRejected() {
        when(heroRepository.findAllBySlugIn(any())).thenReturn(List.of());

        assertThatThrownBy(() -> service.createCategory(new CategoryRequest("beam", "Beam", null, List.of("nobody"))))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("nobody");
    }

    @Test
    void creatingAMatchupRejectsAnExistingPair() {
        Hero pharah = hero("pharah", "Pharah", HeroRole.DAMAGE, true);
        pharah.setId(1L);
        HeroCategory hitscan = category("hitscan", "Hitscan");
        hitscan.setId(2L);
        when(heroRepository.findBySlug("pharah")).thenReturn(Optional.of(pharah));
        when(categoryRepository.findBySlug("hitscan")).thenReturn(Optional.of(hitscan));
        when(relationRepository.existsByHeroIdAndCategoryIdAndIdNot(1L, 2L, -1L)).thenReturn(true);

        assertThatThrownBy(() -> service.createMatchup(
                new CategoryMatchupRequest("pharah", "hitscan", CategoryMatchupType.WEAK_AGAINST, null)))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void creatingAMatchupSavesType() {
        Hero pharah = hero("pharah", "Pharah", HeroRole.DAMAGE, true);
        pharah.setId(1L);
        HeroCategory hitscan = category("hitscan", "Hitscan");
        hitscan.setId(2L);
        when(heroRepository.findBySlug("pharah")).thenReturn(Optional.of(pharah));
        when(categoryRepository.findBySlug("hitscan")).thenReturn(Optional.of(hitscan));
        when(relationRepository.save(any(HeroCategoryRelation.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CategoryMatchupAdminDto created = service.createMatchup(
                new CategoryMatchupRequest("pharah", "hitscan", CategoryMatchupType.WEAK_AGAINST, "note"));

        assertThat(created.type()).isEqualTo(CategoryMatchupType.WEAK_AGAINST);
    }

    private HeroCategory category(String slug, String name, Hero... members) {
        HeroCategory category = new HeroCategory();
        category.setSlug(slug);
        category.setName(name);
        category.getHeroes().addAll(List.of(members));
        return category;
    }

    private Hero hero(String slug, String name, HeroRole role, boolean active) {
        Hero hero = new Hero();
        hero.setSlug(slug);
        hero.setName(name);
        hero.setRole(role);
        hero.setActive(active);
        return hero;
    }
}
