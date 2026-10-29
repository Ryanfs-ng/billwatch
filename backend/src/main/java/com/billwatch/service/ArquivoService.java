package com.billwatch.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;

@Service
public class ArquivoService {

    @Value("${uploads.diretorio}")
    private String diretorioUploads;

    public String salvar(MultipartFile arquivo, Map<String, String> tiposAceitos, String mensagemTipoInvalido) throws IOException {
        String extensao = tiposAceitos.get(arquivo.getContentType());
        if (extensao == null) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, mensagemTipoInvalido);
        }
        Path pasta = Path.of(diretorioUploads);
        Files.createDirectories(pasta);
        String nome = UUID.randomUUID() + extensao;
        Files.copy(arquivo.getInputStream(), pasta.resolve(nome));
        return nome;
    }

    public Resource carregar(String nome, String mensagemAusente) {
        Resource recurso = nome == null ? null : new FileSystemResource(Path.of(diretorioUploads).resolve(nome));
        if (recurso == null || !recurso.exists()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, mensagemAusente);
        }
        return recurso;
    }

    public void apagar(String nome) throws IOException {
        if (nome != null) {
            Files.deleteIfExists(Path.of(diretorioUploads).resolve(nome));
        }
    }
}
