package com.billwatch.service;

import com.billwatch.domain.Usuario;
import com.billwatch.repository.CadastroPendenteRepository;
import com.billwatch.repository.UsuarioRepository;
import com.billwatch.security.JwtService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class GoogleAuthServiceTest {

    private final JwtDecoder decoder = mock(JwtDecoder.class);
    private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
    private final JwtService jwt = mock(JwtService.class);
    private final GoogleAuthService service = new GoogleAuthService(decoder, usuarios, mock(CadastroPendenteRepository.class),
            NoOpPasswordEncoder.getInstance(), jwt);

    GoogleAuthServiceTest() {
        ReflectionTestUtils.setField(service, "clientId", "meu-client-id");
        when(usuarios.findByGoogleId(anyString())).thenReturn(Optional.empty());
        when(usuarios.findByEmail(anyString())).thenReturn(Optional.empty());
        when(usuarios.save(any())).thenAnswer(i -> i.getArgument(0));
        when(jwt.gerarToken(anyString(), anyString())).thenReturn("jwt");
    }

    private void googleDevolve(boolean emailVerificado) {
        when(decoder.decode("credencial")).thenReturn(Jwt.withTokenValue("credencial").header("alg", "RS256")
                .subject("google-123").claim("email", "ryan@gmail.com").claim("email_verified", emailVerificado)
                .claim("name", "Ryan Ferreira").build());
    }

    @Test
    void criaContaNovaComDadosDoGoogle() {
        googleDevolve(true);

        assertThat(service.entrar("credencial").token()).isEqualTo("jwt");

        ArgumentCaptor<Usuario> salvo = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarios).save(salvo.capture());
        assertThat(salvo.getValue().getEmail()).isEqualTo("ryan@gmail.com");
        assertThat(salvo.getValue().getNome()).isEqualTo("Ryan Ferreira");
        assertThat(salvo.getValue().getGoogleId()).isEqualTo("google-123");
        assertThat(salvo.getValue().getSenha()).isNotBlank();
    }

    @Test
    void ligaOGoogleAContaQueJaExisteComOMesmoEmail() {
        googleDevolve(true);
        Usuario existente = Usuario.builder().id(UUID.randomUUID()).nome("Ryan").email("ryan@gmail.com").senha("minha-senha").build();
        when(usuarios.findByEmail("ryan@gmail.com")).thenReturn(Optional.of(existente));

        service.entrar("credencial");

        assertThat(existente.getGoogleId()).isEqualTo("google-123");
        assertThat(existente.getSenha()).isEqualTo("minha-senha");
        assertThat(existente.getNome()).isEqualTo("Ryan");
    }

    @Test
    void recusaEmailNaoVerificadoPeloGoogle() {
        googleDevolve(false);

        assertThatThrownBy(() -> service.entrar("credencial"))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
        verify(usuarios, never()).save(any());
    }

    @Test
    void recusaTokenInvalido() {
        when(decoder.decode("forjado")).thenThrow(new BadJwtException("assinatura inválida"));

        assertThatThrownBy(() -> service.entrar("forjado"))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
        verify(usuarios, never()).save(any());
    }
}
