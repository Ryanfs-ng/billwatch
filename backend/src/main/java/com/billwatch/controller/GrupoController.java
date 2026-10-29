package com.billwatch.controller;

import com.billwatch.dto.EntrarGrupoRequest;
import com.billwatch.dto.GrupoRequest;
import com.billwatch.dto.GrupoResponse;
import com.billwatch.service.GrupoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/grupos")
@RequiredArgsConstructor
public class GrupoController {

    private final GrupoService grupoService;

    @GetMapping("/meu")
    public ResponseEntity<GrupoResponse> meuGrupo(Authentication auth) {
        return grupoService.meuGrupo(auth.getName())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GrupoResponse criar(@Valid @RequestBody GrupoRequest dados, Authentication auth) {
        return grupoService.criar(dados.nome(), auth.getName());
    }

    @PostMapping("/entrar")
    public GrupoResponse entrar(@Valid @RequestBody EntrarGrupoRequest dados, Authentication auth) {
        return grupoService.entrar(dados.codigo(), auth.getName());
    }

    @PostMapping("/sair")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void sair(Authentication auth) {
        grupoService.sair(auth.getName());
    }

    @PostMapping("/codigo")
    public GrupoResponse gerarNovoCodigo(Authentication auth) {
        return grupoService.gerarNovoCodigo(auth.getName());
    }
}
