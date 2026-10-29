package com.billwatch.controller;

import com.billwatch.dto.AlterarEmailRequest;
import com.billwatch.dto.AlterarSenhaRequest;
import com.billwatch.dto.AuthResponse;
import com.billwatch.dto.NotificacoesRequest;
import com.billwatch.dto.PerfilResponse;
import com.billwatch.dto.UsuarioResponse;
import com.billwatch.security.LimiteTentativas;
import com.billwatch.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    public List<UsuarioResponse> listar(Authentication auth) {
        return usuarioService.listarUsuarios(auth.getName());
    }

    @GetMapping("/eu")
    public PerfilResponse perfil(Authentication auth) {
        return usuarioService.perfil(auth.getName());
    }

    @PutMapping("/eu/email")
    @LimiteTentativas(maximo = 5, periodoMinutos = 15)
    public AuthResponse alterarEmail(@Valid @RequestBody AlterarEmailRequest dados, Authentication auth) {
        return usuarioService.alterarEmail(auth.getName(), dados.novoEmail(), dados.senhaAtual());
    }

    @PutMapping("/eu/senha")
    @LimiteTentativas(maximo = 5, periodoMinutos = 15)
    public AuthResponse alterarSenha(@Valid @RequestBody AlterarSenhaRequest dados, Authentication auth) {
        return usuarioService.alterarSenha(auth.getName(), dados.senhaAtual(), dados.novaSenha());
    }

    @PutMapping("/eu/notificacoes")
    public PerfilResponse alterarNotificacoes(@Valid @RequestBody NotificacoesRequest dados, Authentication auth) {
        return usuarioService.alterarNotificacoes(auth.getName(), dados);
    }

    @PutMapping(value = "/eu/foto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PerfilResponse alterarFoto(@RequestParam("arquivo") MultipartFile arquivo, Authentication auth) throws IOException {
        return usuarioService.alterarFoto(auth.getName(), arquivo);
    }

    @DeleteMapping("/eu/foto")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removerFoto(Authentication auth) throws IOException {
        usuarioService.removerFoto(auth.getName());
    }

    @GetMapping("/{id}/foto")
    public ResponseEntity<Resource> foto(@PathVariable UUID id, Authentication auth) {
        Resource recurso = usuarioService.carregarFoto(id, auth.getName());
        MediaType tipo = MediaTypeFactory.getMediaType(recurso).orElse(MediaType.APPLICATION_OCTET_STREAM);
        return ResponseEntity.ok().contentType(tipo).body(recurso);
    }
}
