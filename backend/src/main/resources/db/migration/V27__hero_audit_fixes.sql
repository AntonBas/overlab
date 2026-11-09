UPDATE perks p
SET description = 'Surging Strike gains 125% lifesteal.',
    imported_description = CASE WHEN p.imported THEN 'Surging Strike gains 125% lifesteal.' ELSE p.imported_description END,
    updated_at = now()
FROM heroes h
WHERE p.hero_id = h.id AND h.slug = 'dmon' AND p.name = 'Overstrike';

UPDATE perks p
SET description = 'Barrier Projector heals allies within it for 30 health per second.',
    imported_description = CASE WHEN p.imported THEN 'Barrier Projector heals allies within it for 30 health per second.' ELSE p.imported_description END,
    updated_at = now()
FROM heroes h
WHERE p.hero_id = h.id AND h.slug = 'winston' AND p.name = 'Revitalizing Barrier';

UPDATE perks p
SET description = 'Echo has infinite ammo during Flight, and using Flight refills her ammo.',
    imported_description = CASE WHEN p.imported THEN 'Echo has infinite ammo during Flight, and using Flight refills her ammo.' ELSE p.imported_description END,
    recommendation = 'OPTIONAL',
    recommendation_note = 'Flight is short, so infinite ammo alone is rarely needed, but the refill on use keeps her magazine full when she re-engages. Partial Scan is still the stronger pick.',
    updated_at = now()
FROM heroes h
WHERE p.hero_id = h.id AND h.slug = 'echo' AND p.name = 'Aerial Munitions';

UPDATE heroes
SET strengths = E'Run-and-gun burst rifle: zooming does not slow him down and tightens the burst, so he is strong at close and mid range.\nHitscan fire hits airborne heroes like Pharah and Echo easily.\n[[emre/cyber-frag]] adds a bounce-and-stick grenade for extra burst, and his health regeneration starts sooner, so he depends less on healers.',
    weaknesses = E'Rifle damage falls off from 25 m and is lower than Soldier: 76 or Cassidy at range.\nOne headshot from Widowmaker kills him, and he has few answers to her.\n[[emre/override-protocol]] is easy to shut down if he activates it under fire.',
    updated_at = now()
WHERE slug = 'emre';

DELETE FROM hero_category_members m
USING hero_categories c, heroes h
WHERE m.category_id = c.id AND m.hero_id = h.id AND c.slug = 'long-range' AND h.slug = 'emre';

DELETE FROM hero_category_relations r
USING hero_categories c, heroes h
WHERE r.category_id = c.id AND r.hero_id = h.id AND c.slug = 'dive' AND h.slug = 'emre' AND r.type = 'WEAK_AGAINST';

UPDATE heroes
SET weaknesses = replace(weaknesses, '[[shion/execution]] is slow to charge and Brigitte can block or bash it.',
        '[[shion/execution]] loses most of its damage at range, and Brigitte can block or bash it.'),
    updated_at = now()
WHERE slug = 'shion';

UPDATE heroes
SET weaknesses = replace(weaknesses, 'survive him.', 'survive her.'),
    updated_at = now()
WHERE slug = 'shion';

INSERT INTO hero_category_members (category_id, hero_id)
SELECT c.id, h.id
FROM hero_categories c
JOIN heroes h ON h.slug = 'shion'
WHERE c.slug = 'hitscan'
ON CONFLICT DO NOTHING;

UPDATE heroes
SET description = replace(description, 'He pushes forward', 'She pushes forward'),
    updated_at = now()
WHERE slug = 'dmon';

UPDATE hero_relations r
SET note = replace(note, 'help him reposition', 'help her reposition'), updated_at = now()
FROM heroes a, heroes b
WHERE r.hero_id = a.id AND r.related_hero_id = b.id AND a.slug = 'mauga' AND b.slug = 'dmon';

UPDATE hero_relations r
SET note = replace(note, 'from getting him out', 'from getting her out'), updated_at = now()
FROM heroes a, heroes b
WHERE r.hero_id = a.id AND r.related_hero_id = b.id AND a.slug = 'ramattra' AND b.slug = 'dmon';

UPDATE hero_relations r
SET note = replace(note, 'helps her escape', 'helps him escape'), updated_at = now()
FROM heroes a, heroes b
WHERE r.hero_id = a.id AND r.related_hero_id = b.id AND a.slug IN ('tracer', 'wrecking-ball') AND b.slug IN ('doctrine', 'lifeweaver');

UPDATE hero_relations r
SET note = replace(note, 'returns her [[doctrine/eternal-scepter]] projectiles', 'returns Doctrine''s [[doctrine/eternal-scepter]] shots'), updated_at = now()
FROM heroes a, heroes b
WHERE r.hero_id = a.id AND r.related_hero_id = b.id AND a.slug = 'genji' AND b.slug = 'doctrine';

UPDATE hero_relations r
SET note = replace(replace(note, 'helps her avoid', 'helps him avoid'), 'kill her', 'kill him'), updated_at = now()
FROM heroes a, heroes b
WHERE r.hero_id = a.id AND r.related_hero_id = b.id AND a.slug = 'doctrine' AND b.slug = 'roadhog';

UPDATE hero_relations r
SET note = replace(note, 'helps her get away if she sees him coming', 'helps him get away if he sees Winston coming'), updated_at = now()
FROM heroes a, heroes b
WHERE r.hero_id = a.id AND r.related_hero_id = b.id AND a.slug = 'winston' AND b.slug = 'lifeweaver';

UPDATE heroes
SET strengths = replace(strengths, E'Primary fire can melt tanks once charged.',
        E'Primary fire can melt tanks once charged.\nHitting barriers from Ramattra, Sigma or Domina also charges her beam.'),
    weaknesses = E'Low health and no mobility, so flankers and snipers get to her easily.\nShort beam range and weak against armor.\nKilling her stops charge buildup, so she must stay safe.\nTurrets and the teleporter can be shot down while they deploy.',
    updated_at = now()
WHERE slug = 'symmetra';

UPDATE heroes
SET strengths = replace(strengths, E'Takes little damage, so supports can focus on healing others.',
        E'[[widowmaker/infra-sight]] reveals enemies through walls for the whole team.'),
    updated_at = now()
WHERE slug = 'widowmaker';

UPDATE heroes
SET weaknesses = replace(weaknesses, E'Symmetra''s turret and primary fire handle her engage.',
        E'Heroes who out-damage her up close (Zarya, D.Va, Roadhog) and snipers like Widowmaker punish her engage.'),
    updated_at = now()
WHERE slug = 'moira';

DELETE FROM hero_relations r
USING heroes a, heroes b
WHERE r.hero_id = a.id AND r.related_hero_id = b.id AND r.type = 'COUNTER'
  AND (a.slug, b.slug) IN (
      ('echo', 'widowmaker'),
      ('hanzo', 'tracer'),
      ('tracer', 'symmetra'),
      ('mercy', 'widowmaker'),
      ('lucio', 'roadhog'),
      ('doomfist', 'ana'),
      ('reinhardt', 'winston'),
      ('reinhardt', 'wrecking-ball'),
      ('reinhardt', 'dva'),
      ('anran', 'illari'),
      ('anran', 'kiriko'),
      ('mei', 'dva'),
      ('brigitte', 'dva'),
      ('wrecking-ball', 'hanzo'),
      ('widowmaker', 'soldier-76')
  );

INSERT INTO hero_relations (hero_id, related_hero_id, type, note)
SELECT a.id, b.id, 'COUNTER', v.note
FROM (VALUES
    ('symmetra', 'tracer', 'Why it works: [[symmetra/sentry-turret]] slows Tracer and aims by itself, so [[tracer/blink]] dodging does not help, and [[symmetra/photon-projector]] locks onto her. Limits: Tracer can get behind Symmetra and kill her low health quickly.'),
    ('widowmaker', 'mercy', 'Why it works: One headshot from [[widowmaker/widows-kiss]] kills an exposed Mercy before her team reacts. Limits: [[mercy/guardian-angel]] lets Mercy leave the sightline, and Mercy next to her team is hard to reach.'),
    ('roadhog', 'lucio', 'Why it works: [[roadhog/chain-hook]] pulls Lúcio off [[lucio/wall-ride]] and [[roadhog/scrap-gun]] finishes him. Limits: [[lucio/soundwave]] pushes Roadhog away, and wall riding makes the hook hard to land.'),
    ('ana', 'doomfist', 'Why it works: [[ana/sleep-dart]] stops [[doomfist/rocket-punch]] combos, and [[ana/biotic-grenade]] cuts the healing his team gives him. Limits: Doomfist reaches Ana quickly if the dart misses.'),
    ('winston', 'reinhardt', 'Why it works: [[winston/jump-pack]] gets around the barrier, and [[winston/tesla-cannon]] needs no aim, so Winston pressures Reinhardt''s backline. Limits: [[reinhardt/charge]] pins Winston if he lands in front of the barrier.'),
    ('wrecking-ball', 'reinhardt', 'Why it works: [[wrecking-ball/roll]] and [[wrecking-ball/grappling-claw]] keep Ball out of reach of the hammer, and [[wrecking-ball/piledriver]] punishes Reinhardt''s team. Limits: [[reinhardt/charge]] pins Ball if he is caught against a wall.'),
    ('illari', 'anran', 'Why it works: [[illari/healing-pylon]] negates Anran''s burn, and [[illari/outburst]] pushes her away. Limits: [[anran/inferno-rush]] can reach Illari before the pylon is placed.'),
    ('kiriko', 'anran', 'Why it works: [[kiriko/protection-suzu]] cleanses [[anran/ignition]], and kunai headshots punish predictable [[anran/inferno-rush]]. Limits: Anran reaches Kiriko if Suzu is on cooldown.')
) AS v(hero_slug, related_slug, note)
JOIN heroes a ON a.slug = v.hero_slug
JOIN heroes b ON b.slug = v.related_slug
ON CONFLICT DO NOTHING;
