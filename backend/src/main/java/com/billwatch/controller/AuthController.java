package com.billwatch.controller;

import com.billwatch.dto.AuthResponse;
import com.billwatch.dto.LoginRequest;
import com.billwatch.dto.RegistrarRequest;
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
}
