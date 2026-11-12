package gg.overlab.backend.hero.category;

import gg.overlab.backend.audit.AuditEntityType;
import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.config.cache.CacheNames;
import gg.overlab.backend.config.cache.EvictContentCaches;
import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.category.dto.CategoryAdminDto;
import gg.overlab.backend.hero.category.dto.CategoryMatchupAdminDto;
import gg.overlab.backend.hero.category.dto.CategoryMatchupDto;
import gg.overlab.backend.hero.category.dto.CategoryMatchupRequest;
import gg.overlab.backend.hero.category.dto.CategoryMemberDto;
import gg.overlab.backend.hero.category.dto.CategoryRequest;
import gg.overlab.backend.hero.category.dto.HeroCategoriesDto;
import gg.overlab.backend.hero.category.dto.HeroCategoryDto;
import gg.overlab.backend.media.MediaUrlResolver;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HeroCategoryService {

    private static final Comparator<Hero> BY_ROLE_THEN_NAME =
            Comparator.comparing(Hero::getRole).thenComparing(Hero::getName);

    private final HeroCategoryRepository categoryRepository;
    private final HeroCategoryRelationRepository relationRepository;
    private final HeroRepository heroRepository;
    private final AuditService auditService;
    private final MediaUrlResolver mediaUrlResolver;

    @Cacheable(value = CacheNames.CONTENT, key = "'categories:all'")
    @Transactional(readOnly = true)
    public HeroCategoriesDto findAll() {
        List<HeroCategoryDto> categories = categoryRepository.findAllByOrderByNameAsc().stream()
                .map(this::toDto).toList();
        List<CategoryMatchupDto> matchups = relationRepository.findAllByOrderByIdAsc().stream()
                .map(relation -> new CategoryMatchupDto(relation.getHero().getSlug(), relation.getCategory().getSlug(),
                        relation.getType(), relation.getNote()))
                .toList();
        return new HeroCategoriesDto(categories, matchups);
    }

    @Transactional(readOnly = true)
    public List<CategoryAdminDto> findCategoriesForAdmin() {
        return categoryRepository.findAllByOrderByNameAsc().stream().map(this::toAdminDto).toList();
    }

    @EvictContentCaches
    @Transactional
    public CategoryAdminDto createCategory(CategoryRequest request) {
        HeroCategory category = new HeroCategory();
        applyCategory(category, request, null);
        CategoryAdminDto created = toAdminDto(categoryRepository.save(category));
        auditService.logCreate(AuditEntityType.HERO_CATEGORY, created.id(), created);
        return created;
    }

    @EvictContentCaches
    @Transactional
    public CategoryAdminDto updateCategory(Long id, CategoryRequest request) {
        HeroCategory category = requireCategory(id);
        CategoryAdminDto before = toAdminDto(category);
        applyCategory(category, request, id);
        CategoryAdminDto after = toAdminDto(category);
        auditService.logUpdate(AuditEntityType.HERO_CATEGORY, id, before, after);
        return after;
    }

    @EvictContentCaches
    @Transactional
    public void deleteCategory(Long id) {
        HeroCategory category = requireCategory(id);
        auditService.logDelete(AuditEntityType.HERO_CATEGORY, id, toAdminDto(category));
        categoryRepository.delete(category);
    }

    @Transactional(readOnly = true)
    public List<CategoryMatchupAdminDto> findMatchupsForAdmin() {
        return relationRepository.findAllByOrderByIdAsc().stream().map(this::toAdminDto).toList();
    }

    @EvictContentCaches
    @Transactional
    public CategoryMatchupAdminDto createMatchup(CategoryMatchupRequest request) {
        HeroCategoryRelation relation = new HeroCategoryRelation();
        applyMatchup(relation, request, null);
        CategoryMatchupAdminDto created = toAdminDto(relationRepository.save(relation));
        auditService.logCreate(AuditEntityType.HERO_CATEGORY_RELATION, created.id(), created);
        return created;
    }

    @EvictContentCaches
    @Transactional
    public CategoryMatchupAdminDto updateMatchup(Long id, CategoryMatchupRequest request) {
        HeroCategoryRelation relation = requireMatchup(id);
        CategoryMatchupAdminDto before = toAdminDto(relation);
        applyMatchup(relation, request, id);
        CategoryMatchupAdminDto after = toAdminDto(relation);
        auditService.logUpdate(AuditEntityType.HERO_CATEGORY_RELATION, id, before, after);
        return after;
    }

    @EvictContentCaches
    @Transactional
    public void deleteMatchup(Long id) {
        HeroCategoryRelation relation = requireMatchup(id);
        auditService.logDelete(AuditEntityType.HERO_CATEGORY_RELATION, id, toAdminDto(relation));
        relationRepository.delete(relation);
    }

    private void applyCategory(HeroCategory category, CategoryRequest request, Long excludedId) {
        boolean slugTaken = excludedId == null
                ? categoryRepository.existsBySlug(request.slug())
                : categoryRepository.existsBySlugAndIdNot(request.slug(), excludedId);
        if (slugTaken) {
            throw new ConflictException("A category with slug " + request.slug() + " already exists");
        }
        Set<String> requestedSlugs = new LinkedHashSet<>(request.heroSlugs());
        List<Hero> heroes = heroRepository.findAllBySlugIn(requestedSlugs);
        if (heroes.size() != requestedSlugs.size()) {
            Set<String> found = heroes.stream().map(Hero::getSlug).collect(Collectors.toSet());
            requestedSlugs.removeAll(found);
            throw new BadRequestException("Unknown heroes: " + String.join(", ", requestedSlugs));
        }
        category.setSlug(request.slug());
        category.setName(request.name());
        category.setDescription(request.description());
        category.getHeroes().clear();
        category.getHeroes().addAll(heroes);
    }

    private void applyMatchup(HeroCategoryRelation relation, CategoryMatchupRequest request, Long excludedId) {
        Hero hero = heroRepository.findBySlug(request.heroSlug())
                .orElseThrow(() -> new EntityNotFoundException("Hero", request.heroSlug()));
        HeroCategory category = categoryRepository.findBySlug(request.categorySlug())
                .orElseThrow(() -> new EntityNotFoundException("Hero category", request.categorySlug()));
        boolean matchupTaken = excludedId == null
                ? relationRepository.existsByHeroIdAndCategoryId(hero.getId(), category.getId())
                : relationRepository.existsByHeroIdAndCategoryIdAndIdNot(hero.getId(), category.getId(), excludedId);
        if (matchupTaken) {
            throw new ConflictException("A matchup between this hero and category already exists");
        }
        relation.setHero(hero);
        relation.setCategory(category);
        relation.setType(request.type());
        relation.setNote(request.note());
    }

    private HeroCategoryDto toDto(HeroCategory category) {
        List<CategoryMemberDto> members = category.getHeroes().stream()
                .filter(Hero::isActive)
                .sorted(BY_ROLE_THEN_NAME)
                .map(hero -> new CategoryMemberDto(hero.getSlug(), hero.getName(), hero.getRole(),
                        mediaUrlResolver.resolve(hero.getPortraitUrl())))
                .toList();
        return new HeroCategoryDto(category.getSlug(), category.getName(), category.getDescription(), members);
    }

    private CategoryAdminDto toAdminDto(HeroCategory category) {
        List<String> heroSlugs = category.getHeroes().stream().map(Hero::getSlug).sorted().toList();
        return new CategoryAdminDto(category.getId(), category.getSlug(), category.getName(),
                category.getDescription(), heroSlugs);
    }

    private CategoryMatchupAdminDto toAdminDto(HeroCategoryRelation relation) {
        return new CategoryMatchupAdminDto(relation.getId(), relation.getHero().getSlug(),
                relation.getCategory().getSlug(), relation.getType(), relation.getNote());
    }

    private HeroCategory requireCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Hero category", id));
    }

    private HeroCategoryRelation requireMatchup(Long id) {
        return relationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Hero category matchup", id));
    }
}
