ALTER TABLE perks ADD COLUMN position VARCHAR(8) NOT NULL DEFAULT 'LEFT';

UPDATE perks
SET position = 'RIGHT'
FROM (
    SELECT id, row_number() OVER (PARTITION BY hero_id, slot ORDER BY id) AS place
    FROM perks
) AS ordered
WHERE perks.id = ordered.id AND ordered.place = 2;
