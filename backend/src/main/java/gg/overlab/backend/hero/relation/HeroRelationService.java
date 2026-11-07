package gg.overlab.backend.hero.relation;

import gg.overlab.backend.audit.AuditService;
import gg.overlab.backend.config.cache.CacheNames;
import gg.overlab.backend.config.cache.EvictContentCaches;
import gg.overlab.backend.exception.core.BadRequestException;
import gg.overlab.backend.exception.core.ConflictException;
import gg.overlab.backend.exception.core.EntityNotFoundException;
import gg.overlab.backend.hero.Hero;
import gg.overlab.backend.hero.HeroRepository;
import gg.overlab.backend.hero.relation.dto.HeroCountersDto;
import gg.overlab.backend.hero.relation.dto.HeroRelationsDto;
import gg.overlab.backend.hero.relation.dto.RelatedHeroDto;
import gg.overlab.backend.hero.relation.dto.RelationDto;
import gg.overlab.backend.media.MediaUrlResolver;
import gg.overlab.backend.hero.relation.dto.RelationRequest;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HeroRelationService {

    private static final String AUDIT_TYPE = "HeroRelation";

    private static final Comparator<RelatedHeroDto> BY_ROLE_THEN_NAME =
            Comparator.comparing(RelatedHeroDto::role).thenComparing(RelatedHeroDto::name);

    private final HeroRelationRepository relationRepository;
    private final HeroRepository heroRepository;
    private final AuditService auditService;
    private final MediaUrlResolver mediaUrlResolver;

    @Cacheable(value = CacheNames.CONTENT, key = "'counters:' + #heroSlug")
    @Transactional(readOnly = true)
    public HeroCountersDto getCounters(String heroSlug) {
        requireHero(heroSlug);
        List<RelatedHeroDto> counters = relationRepository.findAllByHeroSlugAndType(heroSlug, RelationType.COUNTER)
                .stream().map(relation -> related(relation.getRelatedHero(), relation)).sorted(BY_ROLE_THEN_NAME).toList();
        List<RelatedHeroDto> counteredBy = relationRepository
                .findAllByRelatedHeroSlugAndType(heroSlug, RelationType.COUNTER)
                .stream().map(relation -> related(relation.getHero(), relation)).sorted(BY_ROLE_THEN_NAME).toList();
        return new HeroCountersDto(counters, counteredBy);
    }

    @Cacheable(value = CacheNames.CONTENT, key = "'synergies:' + #heroSlug")
    @Transactional(readOnly = true)
    public List<RelatedHeroDto> getSynergies(String heroSlug) {
        requireHero(heroSlug);
        Map<String, RelatedHeroDto> bySlug = new LinkedHashMap<>();
        relationRepository.findAllByHeroSlugAndType(heroSlug, RelationType.SYNERGY)
                .forEach(relation -> keepFirst(bySlug, related(relation.getRelatedHero(), relation)));
        relationRepository.findAllByRelatedHeroSlugAndType(heroSlug, RelationType.SYNERGY)
                .forEach(relation -> keepFirst(bySlug, related(relation.getHero(), relation)));
        return bySlug.values().stream().sorted(BY_ROLE_THEN_NAME).toList();
    }

    @Cacheable(value = CacheNames.CONTENT, key = "'relations:all'")
    @Transactional(readOnly = true)
    public List<HeroRelationsDto> findAllRelations() {
        Map<String, List<RelatedHeroDto>> counters = new HashMap<>();
        Map<String, List<RelatedHeroDto>> counteredBy = new HashMap<>();
        Map<String, Map<String, RelatedHeroDto>> synergies = new HashMap<>();
        for (HeroRelation relation : relationRepository.findAllByOrderByIdAsc()) {
            Hero hero = relation.getHero();
            Hero relatedHero = relation.getRelatedHero();
            if (relation.getType() == RelationType.COUNTER) {
                counters.computeIfAbsent(hero.getSlug(), slug -> new ArrayList<>()).add(related(relatedHero, relation));
                counteredBy.computeIfAbsent(relatedHero.getSlug(), slug -> new ArrayList<>())
                        .add(related(hero, relation));
            } else {
                keepFirst(synergies.computeIfAbsent(hero.getSlug(), slug -> new LinkedHashMap<>()),
                        related(relatedHero, relation));
                keepFirst(synergies.computeIfAbsent(relatedHero.getSlug(), slug -> new LinkedHashMap<>()),
                        related(hero, relation));
            }
        }
        return heroRepository.findAllByActiveTrueOrderByNameAsc().stream()
                .map(hero -> new HeroRelationsDto(hero.getSlug(),
                        sorted(counters.getOrDefault(hero.getSlug(), List.of())),
                        sorted(counteredBy.getOrDefault(hero.getSlug(), List.of())),
                        sorted(synergies.getOrDefault(hero.getSlug(), Map.of()).values())))
                .toList();
    }

    private List<RelatedHeroDto> sorted(Collection<RelatedHeroDto> heroes) {
        return heroes.stream().sorted(BY_ROLE_THEN_NAME).toList();
    }

    @Transactional(readOnly = true)
    public List<RelationDto> findForAdmin(String heroSlug) {
        List<HeroRelation> relations = heroSlug == null
                ? relationRepository.findAllByOrderByIdAsc()
                : relationRepository.findAllByHeroSlugOrRelatedHeroSlugOrderByIdAsc(heroSlug, heroSlug);
        return relations.stream().map(this::toDto).toList();
    }

    @EvictContentCaches
    @Transactional
    public RelationDto create(RelationRequest request) {
        HeroRelation relation = new HeroRelation();
        apply(relation, request, null);
        RelationDto created = toDto(relationRepository.save(relation));
        auditService.logCreate(AUDIT_TYPE, created.id(), created);
        return created;
    }

    @EvictContentCaches
    @Transactional
    public RelationDto update(Long id, RelationRequest request) {
        HeroRelation relation = relationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Hero relation", id));
        RelationDto before = toDto(relation);
        apply(relation, request, id);
        RelationDto after = toDto(relation);
        auditService.logUpdate(AUDIT_TYPE, id, before, after);
        return after;
    }

    @EvictContentCaches
    @Transactional
    public void delete(Long id) {
        HeroRelation relation = relationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Hero relation", id));
        auditService.logDelete(AUDIT_TYPE, id, toDto(relation));
        relationRepository.delete(relation);
    }

    private void apply(HeroRelation relation, RelationRequest request, Long excludedId) {
        if (request.heroSlug().equals(request.relatedHeroSlug())) {
            throw new BadRequestException("A hero cannot be related to itself");
        }
        Hero hero = requireHero(request.heroSlug());
        Hero relatedHero = requireHero(request.relatedHeroSlug());
        long excluded = excludedId == null ? -1L : excludedId;
        boolean sameDirection = relationRepository.existsByHeroIdAndRelatedHeroIdAndTypeAndIdNot(
                hero.getId(), relatedHero.getId(), request.type(), excluded);
        boolean oppositeDirection = relationRepository.existsByHeroIdAndRelatedHeroIdAndTypeAndIdNot(
                relatedHero.getId(), hero.getId(), request.type(), excluded);
        if (sameDirection || oppositeDirection) {
            throw new ConflictException("A " + request.type() + " relation between these heroes already exists");
        }
        relation.setHero(hero);
        relation.setRelatedHero(relatedHero);
        relation.setType(request.type());
        relation.setNote(request.note());
    }

    private void keepFirst(Map<String, RelatedHeroDto> bySlug, RelatedHeroDto candidate) {
        bySlug.putIfAbsent(candidate.slug(), candidate);
    }

    private RelatedHeroDto related(Hero hero, HeroRelation relation) {
        return new RelatedHeroDto(hero.getSlug(), hero.getName(), hero.getRole(),
                relation.getNote(), mediaUrlResolver.resolve(hero.getPortraitUrl()));
    }

    private RelationDto toDto(HeroRelation relation) {
        return new RelationDto(relation.getId(), relation.getHero().getSlug(), relation.getRelatedHero().getSlug(),
                relation.getType(), relation.getNote());
    }

    private Hero requireHero(String slug) {
        return heroRepository.findBySlug(slug).orElseThrow(() -> new EntityNotFoundException("Hero", slug));
    }
}
