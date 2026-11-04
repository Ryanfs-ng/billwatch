package com.billwatch.service;

import com.billwatch.domain.Usuario;
import com.billwatch.dto.AuthResponse;
import com.billwatch.repository.CadastroPendenteRepository;
import com.billwatch.repository.UsuarioRepository;
import com.billwatch.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private final JwtDecoder googleJwtDecoder;
    private final UsuarioRepository usuarioRepository;
    private final CadastroPendenteRepository cadastroPendenteRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${google.client-id}")
    private String clientId;

    @Transactional
    public AuthResponse entrar(String credencial) {
        if (clientId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Login com Google não está configurado");
        }
        Jwt token = validar(credencial);
        if (!Boolean.TRUE.equals(token.getClaimAsBoolean("email_verified"))) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "O e-mail desta conta Google não foi verificado");
        }

        String googleId = token.getSubject();
        String email = token.getClaimAsString("email");
        String nome = token.getClaimAsString("name");
        Usuario usuario = usuarioRepository.findByGoogleId(googleId)
                .or(() -> usuarioRepository.findByEmail(email))
                .orElseGet(() -> Usuario.builder()
                        .nome(nome != null && !nome.isBlank() ? nome : email)
                        .email(email)
                        .senha(passwordEncoder.encode(UUID.randomUUID().toString()))
                        .build());
        usuario.setGoogleId(googleId);
        usuario = usuarioRepository.save(usuario);
        cadastroPendenteRepository.findByEmail(email).ifPresent(cadastroPendenteRepository::delete);
        return new AuthResponse(jwtService.gerarToken(usuario.getEmail(), usuario.getNome()));
    }

    private Jwt validar(String credencial) {
        try {
            return googleJwtDecoder.decode(credencial);
        } catch (JwtException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Não foi possível validar o login com Google");
        }
    }
}
