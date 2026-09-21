package com.billwatch.service;

import com.billwatch.domain.Usuario;
import com.billwatch.dto.AuthResponse;
import com.billwatch.dto.LoginRequest;
import com.billwatch.dto.RegistrarRequest;
import com.billwatch.repository.UsuarioRepository;
import com.billwatch.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse registrar (RegistrarRequest dados) {
        if (usuarioRepository.existsByEmail(dados.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado");
        }

        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .nome(dados.nome())
                .email(dados.email())
                .senha(passwordEncoder.encode(dados.senha()))
                .build());
        return new AuthResponse(jwtService.gerarToken(usuario.getEmail()));
    }

    public AuthResponse login (LoginRequest dados) {
        Usuario usuario = usuarioRepository.findByEmail(dados.email())
                .filter(u -> passwordEncoder.matches(dados.senha(),
                        u.getSenha()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas"));
        return new AuthResponse(jwtService.gerarToken(usuario.getEmail()));
    }
}
