CREATE TABLE cadastros_pendentes
(
    id         UUID PRIMARY KEY,
    nome       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL UNIQUE,
    senha      VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expira_em  TIMESTAMPTZ  NOT NULL
);
