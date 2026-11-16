CREATE UNIQUE INDEX uq_hero_relations_pair
    ON hero_relations (LEAST(hero_id, related_hero_id), GREATEST(hero_id, related_hero_id), type);

ALTER TABLE hero_stats
    ADD CONSTRAINT ck_hero_stats_rates CHECK (
        win_rate BETWEEN 0 AND 100
        AND pick_rate BETWEEN 0 AND 100
        AND (ban_rate IS NULL OR ban_rate BETWEEN 0 AND 100));
