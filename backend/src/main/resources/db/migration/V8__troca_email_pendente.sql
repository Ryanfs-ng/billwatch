ALTER TABLE usuarios
    ADD COLUMN email_pendente     VARCHAR(255),
    ADD COLUMN email_token_hash   VARCHAR(255) UNIQUE,
    ADD COLUMN email_token_expira TIMESTAMPTZ;
