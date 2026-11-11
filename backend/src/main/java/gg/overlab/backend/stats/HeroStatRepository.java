package gg.overlab.backend.stats;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface HeroStatRepository extends JpaRepository<HeroStat, Long> {

    @Query("""
            select distinct s.capturedAt from HeroStat s
            where s.map is null
              and s.queue = :queue and s.platform = :platform and s.region = :region and s.tier = :tier
            order by s.capturedAt desc
            """)
    List<Instant> findRecentCaptureTimes(@Param("queue") GameQueue queue,
                                         @Param("platform") Platform platform,
                                         @Param("region") Region region,
                                         @Param("tier") RankTier tier,
                                         Pageable pageable);

    @Query("""
            select new gg.overlab.backend.stats.RateRow(s.hero.id, s.winRate, s.pickRate, s.banRate, s.capturedAt)
            from HeroStat s
            where s.map is null
              and s.queue = :queue and s.platform = :platform and s.region = :region and s.tier = :tier
              and s.capturedAt in :capturedAt
            """)
    List<RateRow> findRatesAt(@Param("queue") GameQueue queue,
                              @Param("platform") Platform platform,
                              @Param("region") Region region,
                              @Param("tier") RankTier tier,
                              @Param("capturedAt") Collection<Instant> capturedAt);

    @Query("""
            select s from HeroStat s join fetch s.hero
            where s.map is null
              and s.queue = :queue and s.gameFormat = :gameFormat and s.platform = :platform
              and s.region = :region and s.tier = :tier
              and s.capturedAt = (
                select max(x.capturedAt) from HeroStat x
                where x.map is null and x.capturedAt < :before
                  and x.queue = :queue and x.gameFormat = :gameFormat and x.platform = :platform
                  and x.region = :region and x.tier = :tier)
            """)
    List<HeroStat> findPreviousForAllMaps(@Param("queue") GameQueue queue,
                                          @Param("gameFormat") GameFormat gameFormat,
                                          @Param("platform") Platform platform,
                                          @Param("region") Region region,
                                          @Param("tier") RankTier tier,
                                          @Param("before") Instant before);

    @Query("""
            select s from HeroStat s join fetch s.hero join s.map m
            where m.slug = :mapSlug
              and s.queue = :queue and s.gameFormat = :gameFormat and s.platform = :platform
              and s.region = :region and s.tier = :tier
              and s.capturedAt = (
                select max(x.capturedAt) from HeroStat x join x.map xm
                where xm.slug = :mapSlug and x.capturedAt < :before
                  and x.queue = :queue and x.gameFormat = :gameFormat and x.platform = :platform
                  and x.region = :region and x.tier = :tier)
            """)
    List<HeroStat> findPreviousForMap(@Param("mapSlug") String mapSlug,
                                      @Param("queue") GameQueue queue,
                                      @Param("gameFormat") GameFormat gameFormat,
                                      @Param("platform") Platform platform,
                                      @Param("region") Region region,
                                      @Param("tier") RankTier tier,
                                      @Param("before") Instant before);

    @Query("""
            select s from HeroStat s join fetch s.hero
            where s.map is null
              and s.queue = :queue and s.platform = :platform and s.region = :region and s.tier = :tier
              and s.capturedAt = (
                select max(x.capturedAt) from HeroStat x
                where x.map is null
                  and x.queue = :queue and x.platform = :platform and x.region = :region and x.tier = :tier)
            """)
    List<HeroStat> findLatestForAllMaps(@Param("queue") GameQueue queue,
                                        @Param("platform") Platform platform,
                                        @Param("region") Region region,
                                        @Param("tier") RankTier tier);

    @Query("""
            select s from HeroStat s join fetch s.hero join s.map m
            where m.slug = :mapSlug
              and s.queue = :queue and s.platform = :platform and s.region = :region and s.tier = :tier
              and s.capturedAt = (
                select max(x.capturedAt) from HeroStat x join x.map xm
                where xm.slug = :mapSlug
                  and x.queue = :queue and x.platform = :platform and x.region = :region and x.tier = :tier)
            """)
    List<HeroStat> findLatestForMap(@Param("mapSlug") String mapSlug,
                                    @Param("queue") GameQueue queue,
                                    @Param("platform") Platform platform,
                                    @Param("region") Region region,
                                    @Param("tier") RankTier tier);

    default List<HeroStat> findLatestForHero(String heroSlug, GameQueue queue, Platform platform, Region region,
                                             RankTier tier) {
        List<Long> ids = findLatestIdsForHero(heroSlug, queue.name(), platform.name(), region.name(), tier.name());
        return ids.isEmpty() ? List.of() : findWithHeroAndMapByIdIn(ids);
    }

    @Query(value = """
            select distinct on (s.map_id) s.id
            from hero_stats s join heroes h on h.id = s.hero_id
            where h.slug = :heroSlug
              and s.queue = :queue and s.platform = :platform and s.region = :region and s.tier = :tier
            order by s.map_id, s.captured_at desc
            """, nativeQuery = true)
    List<Long> findLatestIdsForHero(@Param("heroSlug") String heroSlug,
                                    @Param("queue") String queue,
                                    @Param("platform") String platform,
                                    @Param("region") String region,
                                    @Param("tier") String tier);

    @Query("select s from HeroStat s join fetch s.hero left join fetch s.map where s.id in :ids")
    List<HeroStat> findWithHeroAndMapByIdIn(@Param("ids") Collection<Long> ids);

    @Query("""
            select s from HeroStat s
            where s.hero.slug = :heroSlug and s.map is null
              and s.queue = :queue and s.platform = :platform and s.region = :region and s.tier = :tier
              and s.capturedAt between :from and :to
            order by s.capturedAt
            """)
    List<HeroStat> findHistoryForAllMaps(@Param("heroSlug") String heroSlug,
                                         @Param("queue") GameQueue queue,
                                         @Param("platform") Platform platform,
                                         @Param("region") Region region,
                                         @Param("tier") RankTier tier,
                                         @Param("from") Instant from,
                                         @Param("to") Instant to);

    @Query("""
            select s from HeroStat s join s.map m
            where s.hero.slug = :heroSlug and m.slug = :mapSlug
              and s.queue = :queue and s.platform = :platform and s.region = :region and s.tier = :tier
              and s.capturedAt between :from and :to
            order by s.capturedAt
            """)
    List<HeroStat> findHistoryForMap(@Param("heroSlug") String heroSlug,
                                     @Param("mapSlug") String mapSlug,
                                     @Param("queue") GameQueue queue,
                                     @Param("platform") Platform platform,
                                     @Param("region") Region region,
                                     @Param("tier") RankTier tier,
                                     @Param("from") Instant from,
                                     @Param("to") Instant to);

    @Query("""
            select max(s.capturedAt) from HeroStat s
            where s.map is null
              and s.queue = :queue and s.platform = :platform and s.region = :region and s.tier = :tier
              and s.capturedAt <= :at
            """)
    Optional<Instant> findCaptureAtOrBeforeForAllMaps(@Param("queue") GameQueue queue,
                                                      @Param("platform") Platform platform,
                                                      @Param("region") Region region,
                                                      @Param("tier") RankTier tier,
                                                      @Param("at") Instant at);

    @Query("""
            select min(s.capturedAt) from HeroStat s
            where s.map is null
              and s.queue = :queue and s.platform = :platform and s.region = :region and s.tier = :tier
            """)
    Optional<Instant> findFirstCaptureForAllMaps(@Param("queue") GameQueue queue,
                                                 @Param("platform") Platform platform,
                                                 @Param("region") Region region,
                                                 @Param("tier") RankTier tier);

    @Query("""
            select max(s.capturedAt) from HeroStat s join s.map m
            where m.slug = :mapSlug
              and s.queue = :queue and s.platform = :platform and s.region = :region and s.tier = :tier
              and s.capturedAt <= :at
            """)
    Optional<Instant> findCaptureAtOrBeforeForMap(@Param("mapSlug") String mapSlug,
                                                  @Param("queue") GameQueue queue,
                                                  @Param("platform") Platform platform,
                                                  @Param("region") Region region,
                                                  @Param("tier") RankTier tier,
                                                  @Param("at") Instant at);

    @Query("""
            select s from HeroStat s join fetch s.hero
            where s.map is null
              and s.queue = :queue and s.platform = :platform and s.region = :region and s.tier = :tier
              and s.capturedAt = :capturedAt
            """)
    List<HeroStat> findSnapshotForAllMaps(@Param("queue") GameQueue queue,
                                          @Param("platform") Platform platform,
                                          @Param("region") Region region,
                                          @Param("tier") RankTier tier,
                                          @Param("capturedAt") Instant capturedAt);

    @Query("""
            select s from HeroStat s join fetch s.hero join s.map m
            where m.slug = :mapSlug
              and s.queue = :queue and s.platform = :platform and s.region = :region and s.tier = :tier
              and s.capturedAt = :capturedAt
            """)
    List<HeroStat> findSnapshotForMap(@Param("mapSlug") String mapSlug,
                                      @Param("queue") GameQueue queue,
                                      @Param("platform") Platform platform,
                                      @Param("region") Region region,
                                      @Param("tier") RankTier tier,
                                      @Param("capturedAt") Instant capturedAt);

    @Query("select min(s.capturedAt) from HeroStat s where s.capturedAt < :threshold")
    Optional<Instant> findOldestCaptureBefore(@Param("threshold") Instant threshold);

    @Transactional
    @Modifying
    @Query(value = """
            delete from hero_stats
            where captured_at >= cast(:windowStart as timestamptz)
              and captured_at < cast(:windowEnd as timestamptz)
              and id not in (
                select distinct on (hero_id, map_id, queue, game_format, platform, region, tier) id
                from hero_stats
                where captured_at >= cast(:windowStart as timestamptz)
                  and captured_at < cast(:windowEnd as timestamptz)
                order by hero_id, map_id, queue, game_format, platform, region, tier, captured_at desc)
            """, nativeQuery = true)
    int deleteWindowKeepingLatest(@Param("windowStart") Instant windowStart, @Param("windowEnd") Instant windowEnd);
}
