ALTER TABLE perks ADD COLUMN imported BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE perks ADD COLUMN imported_description TEXT;

UPDATE perks SET imported = TRUE, imported_description = description;
