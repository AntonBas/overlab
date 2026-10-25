ALTER TABLE guides ADD COLUMN slug VARCHAR(200);
UPDATE guides SET slug = 'guide-' || id;
ALTER TABLE guides ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX uq_guides_slug ON guides (slug);

ALTER TABLE patches ADD COLUMN slug VARCHAR(64);
UPDATE patches SET slug = 'patch-' || id;
ALTER TABLE patches ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX uq_patches_slug ON patches (slug);
