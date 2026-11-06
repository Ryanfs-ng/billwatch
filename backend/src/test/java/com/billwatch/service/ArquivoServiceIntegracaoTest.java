package com.billwatch.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class ArquivoServiceIntegracaoTest {

    private static final Map<String, String> TIPOS = Map.of("application/pdf", ".pdf");

    @Autowired
    private ArquivoService arquivos;

    @Test
    void salvaCarregaEApagaNoBanco() throws Exception {
        byte[] conteudo = "%PDF-1.4 boleto".getBytes();
        String nome = arquivos.salvar(new MockMultipartFile("arquivo", "boleto.pdf", "application/pdf", conteudo), TIPOS, "tipo inválido");

        Resource recurso = arquivos.carregar(nome, "sem anexo");
        assertThat(nome).endsWith(".pdf");
        assertThat(recurso.getFilename()).isEqualTo(nome);
        assertThat(recurso.getContentAsByteArray()).isEqualTo(conteudo);

        arquivos.apagar(nome);
        assertThatThrownBy(() -> arquivos.carregar(nome, "sem anexo"))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void recusaTipoNaoAceito() {
        MockMultipartFile executavel = new MockMultipartFile("arquivo", "virus.exe", "application/x-msdownload", new byte[]{1});

        assertThatThrownBy(() -> arquivos.salvar(executavel, TIPOS, "tipo inválido"))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.UNSUPPORTED_MEDIA_TYPE));
    }
}
