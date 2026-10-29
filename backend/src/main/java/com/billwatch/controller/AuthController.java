package com.billwatch.controller;

import com.billwatch.dto.*;
import com.billwatch.security.LimiteTentativas;
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
    @LimiteTentativas(maximo = 5, periodoMinutos = 60)
    public AuthResponse registrar (@Valid @RequestBody RegistrarRequest dados ) {
        return usuarioService.registrar(dados);
    }

    @PostMapping("/login")
    @LimiteTentativas(maximo = 10, periodoMinutos = 1)
    public AuthResponse login (@Valid @RequestBody LoginRequest dados) {
        return usuarioService.login(dados);
    }

    @PostMapping("/esqueci-senha")
    @ResponseStatus(HttpStatus.OK)
    @LimiteTentativas(maximo = 3, periodoMinutos = 15)
    public void esqueciSenha(@Valid @RequestBody EsqueciSenhaRequest dados){
        usuarioService.esqueciSenha(dados.email());
    }

    @PostMapping("/redefinir-senha")
    @ResponseStatus(HttpStatus.OK)
    public void redefinirSenha(@Valid @RequestBody RedefinirSenhaRequest dados){
        usuarioService.redefinirSenha(dados.token(), dados.novaSenha());
    }
}
