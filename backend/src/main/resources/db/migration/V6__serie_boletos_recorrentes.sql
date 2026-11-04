ALTER TABLE boletos ADD COLUMN serie_id UUID;

UPDATE boletos SET serie_id = gen_random_uuid() WHERE recorrente;

CREATE INDEX idx_boletos_serie ON boletos (serie_id);
