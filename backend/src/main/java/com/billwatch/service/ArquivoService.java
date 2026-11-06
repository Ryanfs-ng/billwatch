package com.billwatch.service;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ArquivoService {

    private final JdbcTemplate jdbc;

    public String salvar(MultipartFile arquivo, Map<String, String> tiposAceitos, String mensagemTipoInvalido) throws IOException {
        String extensao = tiposAceitos.get(arquivo.getContentType());
        if (extensao == null) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, mensagemTipoInvalido);
        }
        String nome = UUID.randomUUID() + extensao;
        jdbc.update("INSERT INTO arquivos (nome, tipo, conteudo) VALUES (?, ?, ?)", nome, arquivo.getContentType(), arquivo.getBytes());
        return nome;
    }

    public Resource carregar(String nome, String mensagemAusente) {
        List<byte[]> encontrados = nome == null
                ? List.of()
                : jdbc.query("SELECT conteudo FROM arquivos WHERE nome = ?", (linha, i) -> linha.getBytes(1), nome);
        if (encontrados.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, mensagemAusente);
        }
        return new ByteArrayResource(encontrados.get(0)) {
            @Override
            public String getFilename() {
                return nome;
            }
        };
    }

    public void apagar(String nome) {
        if (nome != null) {
            jdbc.update("DELETE FROM arquivos WHERE nome = ?", nome);
        }
    }
}
