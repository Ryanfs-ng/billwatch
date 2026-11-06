CREATE TABLE arquivos
(
    nome      VARCHAR(255) PRIMARY KEY,
    tipo      VARCHAR(100) NOT NULL,
    conteudo  BYTEA        NOT NULL,
    criado_em TIMESTAMPTZ  NOT NULL DEFAULT now()
);
