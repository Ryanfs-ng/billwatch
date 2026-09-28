package com.billwatch.controller;

import com.billwatch.dto.*;
import com.billwatch.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioService usuarioService;

    @PostMapping("/registrar")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse registrar (@Valid @RequestBody RegistrarRequest dados ) {
        return usuarioService.registrar(dados);
    }

    @PostMapping("/login")
    public AuthResponse login (@Valid @RequestBody LoginRequest dados) {
        return usuarioService.login(dados);
    }

    @PostMapping("/esqueci-senha")
    @ResponseStatus(HttpStatus.OK)
    public void esqueciSenha(@Valid @RequestBody EsqueciSenhaRequest dados){
        usuarioService.esqueciSenha(dados.email());
    }

    @PostMapping("/redefinir-senha")
    @ResponseStatus(HttpStatus.OK)
    public void redefinirSenha(@Valid @RequestBody RedefinirSenhaRequest dados){
        usuarioService.redefinirSenha(dados.token(), dados.novaSenha());
    }
}
