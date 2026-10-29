ALTER TABLE usuarios
    ADD COLUMN foto                     VARCHAR(255),
    ADD COLUMN dias_aviso               INTEGER     NOT NULL DEFAULT 7,
    ADD COLUMN aviso_vencimento_ativo   BOOLEAN     NOT NULL DEFAULT TRUE,
    ADD COLUMN resumo_semanal_ativo     BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN credenciais_alteradas_em TIMESTAMPTZ;
