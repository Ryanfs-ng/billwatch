package com.billwatch.service;

import com.billwatch.domain.Usuario;
import com.billwatch.dto.AuthResponse;
import com.billwatch.dto.LoginRequest;
import com.billwatch.dto.RegistrarRequest;
import com.billwatch.repository.UsuarioRepository;
import com.billwatch.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    @Value("${app.link-reset-senha}")
    private String linkResetSenha;

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

    public void esqueciSenha(String email) {
        usuarioRepository.findByEmail(email).ifPresent(usuario -> {
            String token = UUID.randomUUID() + UUID.randomUUID().toString();
            usuario.setResetTokenHash(sha256(token));
            usuario.setResetTokenExpira(Instant.now().plus(30, ChronoUnit.MINUTES));
            usuarioRepository.save(usuario);
            emailService.enviar(email, "Redefinição de senha - Billwatch", "Clique para redefinir sua senha: " + linkResetSenha + "?token=" + token
                                                    + "\nO link expira em 30 minutos.");
        });
    }

    public void redefinirSenha(String token, String novaSenha){
        Usuario usuario = usuarioRepository.findByResetTokenHash(sha256(token))
                .filter(u -> u.getResetTokenExpira().isAfter(Instant.now()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token inválido ou expirado"));
        usuario.setSenha(passwordEncoder.encode(novaSenha));
        usuario.setResetTokenHash(null);
        usuario.setResetTokenExpira(null);
        usuarioRepository.save(usuario);
    }

    private String sha256(String texto) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(texto.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
