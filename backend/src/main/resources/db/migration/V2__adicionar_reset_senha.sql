ALTER TABLE usuarios
    ADD COLUMN reset_token_hash    VARCHAR(255),
    ADD COLUMN reset_token_expira  TIMESTAMPTZ;