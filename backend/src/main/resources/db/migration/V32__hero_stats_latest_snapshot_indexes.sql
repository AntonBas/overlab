CREATE INDEX idx_hero_stats_latest_overall
    ON hero_stats (queue, game_format, platform, region, tier, captured_at DESC)
    WHERE map_id IS NULL;

CREATE INDEX idx_hero_stats_latest_per_map
    ON hero_stats (map_id, queue, game_format, platform, region, tier, captured_at DESC)
    WHERE map_id IS NOT NULL;
