package com.billwatch.controller;

import com.billwatch.dto.*;
import com.billwatch.security.LimiteTentativas;
import com.billwatch.service.GoogleAuthService;
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
    private final GoogleAuthService googleAuthService;

    @PostMapping("/registrar")
    @ResponseStatus(HttpStatus.ACCEPTED)
    @LimiteTentativas(maximo = 5, periodoMinutos = 60)
    public void registrar (@Valid @RequestBody RegistrarRequest dados ) {
        usuarioService.registrar(dados);
    }

    @PostMapping("/confirmar-email")
    @LimiteTentativas(maximo = 10, periodoMinutos = 15)
    public AuthResponse confirmarEmail(@Valid @RequestBody ConfirmarEmailRequest dados) {
        return usuarioService.confirmarEmail(dados.token());
    }

    @PostMapping("/confirmar-novo-email")
    @LimiteTentativas(maximo = 10, periodoMinutos = 15)
    public AuthResponse confirmarNovoEmail(@Valid @RequestBody ConfirmarEmailRequest dados) {
        return usuarioService.confirmarNovoEmail(dados.token());
    }

    @PostMapping("/google")
    @LimiteTentativas(maximo = 20, periodoMinutos = 15)
    public AuthResponse entrarComGoogle(@Valid @RequestBody GoogleLoginRequest dados) {
        return googleAuthService.entrar(dados.credencial());
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
