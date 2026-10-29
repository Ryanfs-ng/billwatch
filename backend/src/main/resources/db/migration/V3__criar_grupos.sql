CREATE TABLE grupos
(
    id             UUID PRIMARY KEY,
    nome           VARCHAR(100) NOT NULL,
    codigo_convite VARCHAR(16)  NOT NULL UNIQUE,
    created_at     TIMESTAMPTZ  NOT NULL
);

ALTER TABLE usuarios
    ADD COLUMN grupo_id UUID REFERENCES grupos (id);
