package com.billwatch.service;

import com.billwatch.domain.CadastroPendente;
import com.billwatch.domain.Usuario;
import com.billwatch.dto.LoginRequest;
import com.billwatch.dto.RegistrarRequest;
import com.billwatch.repository.CadastroPendenteRepository;
import com.billwatch.repository.UsuarioRepository;
import com.billwatch.security.JwtService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.NoOpPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UsuarioServiceTest {

    private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
    private final CadastroPendenteRepository pendentes = mock(CadastroPendenteRepository.class);
    private final JwtService jwt = mock(JwtService.class);
    private final EmailService email = mock(EmailService.class);
    private final UsuarioService service = new UsuarioService(usuarios, pendentes, NoOpPasswordEncoder.getInstance(), jwt, email, mock(ArquivoService.class));

    UsuarioServiceTest() {
        ReflectionTestUtils.setField(service, "linkConfirmarEmail", "http://app/confirmar-email");
        ReflectionTestUtils.setField(service, "linkConfirmarNovoEmail", "http://app/confirmar-novo-email");
        when(pendentes.findByEmail(anyString())).thenReturn(Optional.empty());
        when(usuarios.save(any())).thenAnswer(i -> i.getArgument(0));
        when(jwt.gerarToken(anyString(), anyString())).thenReturn("jwt");
    }

    private String registrarECapturarToken() {
        service.registrar(new RegistrarRequest("Ryan", "ryan@email.com", "senha1234"));
        ArgumentCaptor<String> corpo = ArgumentCaptor.forClass(String.class);
        verify(email).enviar(eq("ryan@email.com"), anyString(), corpo.capture());
        return corpo.getValue().replaceAll("(?s).*\\?token=(\\S+).*", "$1");
    }

    @Test
    void registrarNaoCriaContaSoGuardaPendenteEEnviaLink() {
        registrarECapturarToken();

        verify(usuarios, never()).save(any());
        ArgumentCaptor<CadastroPendente> pendente = ArgumentCaptor.forClass(CadastroPendente.class);
        verify(pendentes).save(pendente.capture());
        assertThat(pendente.getValue().getEmail()).isEqualTo("ryan@email.com");
        assertThat(pendente.getValue().getExpiraEm()).isAfter(Instant.now().plusSeconds(23 * 3600));
    }

    @Test
    void confirmarCriaAContaEApagaOPendente() {
        String token = registrarECapturarToken();
        ArgumentCaptor<CadastroPendente> salvo = ArgumentCaptor.forClass(CadastroPendente.class);
        verify(pendentes).save(salvo.capture());
        when(pendentes.findByTokenHash(salvo.getValue().getTokenHash())).thenReturn(Optional.of(salvo.getValue()));

        assertThat(service.confirmarEmail(token).token()).isEqualTo("jwt");

        ArgumentCaptor<Usuario> usuario = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarios).save(usuario.capture());
        assertThat(usuario.getValue().getEmail()).isEqualTo("ryan@email.com");
        assertThat(usuario.getValue().getNome()).isEqualTo("Ryan");
        verify(pendentes).delete(salvo.getValue());
    }

    @Test
    void linkExpiradoNaoCriaConta() {
        CadastroPendente expirado = new CadastroPendente();
        expirado.setExpiraEm(Instant.now().minusSeconds(1));
        when(pendentes.findByTokenHash(anyString())).thenReturn(Optional.of(expirado));

        assertThatThrownBy(() -> service.confirmarEmail("qualquer"))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
        verify(usuarios, never()).save(any());
    }

    @Test
    void loginDeCadastroNaoConfirmadoPedeConfirmacao() {
        CadastroPendente pendente = new CadastroPendente();
        pendente.setSenha("senha1234");
        when(usuarios.findByEmail("ryan@email.com")).thenReturn(Optional.empty());
        when(pendentes.findByEmail("ryan@email.com")).thenReturn(Optional.of(pendente));

        assertThatThrownBy(() -> service.login(new LoginRequest("ryan@email.com", "senha1234")))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> service.login(new LoginRequest("ryan@email.com", "errada")))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    private Usuario ryanComSenha() {
        Usuario ryan = Usuario.builder().nome("Ryan").email("ryan@email.com").senha("senha1234").build();
        when(usuarios.findByEmail("ryan@email.com")).thenReturn(Optional.of(ryan));
        return ryan;
    }

    @Test
    void trocaDeEmailSoAconteceDepoisDeConfirmarONovoEndereco() {
        Usuario ryan = ryanComSenha();

        service.alterarEmail("ryan@email.com", "novo@email.com", "senha1234");

        assertThat(ryan.getEmail()).isEqualTo("ryan@email.com");
        assertThat(ryan.getEmailPendente()).isEqualTo("novo@email.com");
        ArgumentCaptor<String> corpo = ArgumentCaptor.forClass(String.class);
        verify(email).enviar(eq("novo@email.com"), anyString(), corpo.capture());
        String token = corpo.getValue().replaceAll("(?s).*\\?token=(\\S+).*", "$1");
        when(usuarios.findByEmailTokenHash(ryan.getEmailTokenHash())).thenReturn(Optional.of(ryan));

        assertThat(service.confirmarNovoEmail(token).token()).isEqualTo("jwt");

        assertThat(ryan.getEmail()).isEqualTo("novo@email.com");
        assertThat(ryan.getEmailPendente()).isNull();
        assertThat(ryan.getEmailTokenHash()).isNull();
        assertThat(ryan.getCredenciaisAlteradasEm()).isNotNull();
        verify(email).enviar(eq("ryan@email.com"), anyString(), anyString());
    }

    @Test
    void naoTrocaParaEmailJaUsadoPorOutraConta() {
        Usuario ryan = ryanComSenha();
        when(usuarios.existsByEmail("marta@email.com")).thenReturn(true);

        assertThatThrownBy(() -> service.alterarEmail("ryan@email.com", "marta@email.com", "senha1234"))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
        assertThat(ryan.getEmailPendente()).isNull();
        verify(email, never()).enviar(anyString(), anyString(), anyString());
    }
}
