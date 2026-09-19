package com.billwatch.controller;

import com.billwatch.dto.RegistrarRequest;
import com.billwatch.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Endpoints: POST /auth/registrar, POST /auth/login (a implementar).
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UsuarioService usuarioService;
//
//    @PostMapping("/registrar")
//    public RegistrarRequest registrar (@RequestBody RegistrarRequest dados ) {
//        return void;
//    }
}
