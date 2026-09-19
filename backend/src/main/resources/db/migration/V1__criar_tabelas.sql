CREATE TABLE usuarios
(id         UUID PRIMARY KEY,
 nome       VARCHAR(255) NOT NULL,
email      VARCHAR(255) NOT NULL UNIQUE,
senha      VARCHAR(255) NOT NULL,
created_at TIMESTAMPTZ  NOT NULL
);

CREATE TABLE boletos
(
    id             UUID PRIMARY KEY,
    valor          NUMERIC(19,2)  NOT NULL,
    descricao      VARCHAR(255) NOT NULL,
    data_vencimento DATE         NOT NULL,
    data_anexado    TIMESTAMPTZ NOT NULL ,
    data_pagamento  DATE,
    anexo          VARCHAR(255) NULL,
    responsavel_id UUID NOT NULL REFERENCES usuarios(id),
    notificado_em DATE NULL
);