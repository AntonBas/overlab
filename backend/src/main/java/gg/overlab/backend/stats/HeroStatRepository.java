package gg.overlab.backend.stats;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HeroStatRepository extends JpaRepository<HeroStat, Long> {

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

    @Query("""
            select s from HeroStat s join fetch s.hero h left join fetch s.map
            where h.slug = :heroSlug
              and s.queue = :queue and s.platform = :platform and s.region = :region and s.tier = :tier
              and s.capturedAt = (
                select max(x.capturedAt) from HeroStat x
                where x.hero = s.hero and x.queue = s.queue and x.platform = s.platform
                  and x.region = s.region and x.tier = s.tier
                  and (x.map = s.map or (x.map is null and s.map is null)))
            """)
    List<HeroStat> findLatestForHero(@Param("heroSlug") String heroSlug,
                                     @Param("queue") GameQueue queue,
                                     @Param("platform") Platform platform,
                                     @Param("region") Region region,
                                     @Param("tier") RankTier tier);

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

    @Modifying
    @Query(value = """
            delete from hero_stats
            where captured_at < cast(:threshold as timestamptz)
              and id not in (
                select distinct on (hero_id, map_id, queue, game_format, platform, region, tier,
                                    date_trunc('week', captured_at)) id
                from hero_stats
                where captured_at < cast(:threshold as timestamptz)
                order by hero_id, map_id, queue, game_format, platform, region, tier,
                         date_trunc('week', captured_at), captured_at desc)
            """, nativeQuery = true)
    int deleteOlderKeepingWeeklyLatest(@Param("threshold") Instant threshold);
}
