package com.billwatch.service;

import com.billwatch.domain.Boleto;
import com.billwatch.domain.Usuario;
import com.billwatch.dto.DashboardResponse;
import com.billwatch.repository.BoletoRepository;
import com.billwatch.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class NotificacaoServiceTest {

    private final LocalDate hoje = LocalDate.of(2026, 10, 20);
    private final BoletoRepository boletoRepo = mock(BoletoRepository.class);
    private final UsuarioRepository usuarioRepo = mock(UsuarioRepository.class);
    private final BoletoService boletoService = mock(BoletoService.class);
    private final EmailService email = mock(EmailService.class);
    private final NotificacaoService service = new NotificacaoService(boletoRepo, usuarioRepo, boletoService, email);

    NotificacaoServiceTest() {
        ReflectionTestUtils.setField(service, "urlFrontend", "http://app");
    }

    private static Usuario usuario(String email, int diasAviso, boolean avisoAtivo) {
        return Usuario.builder().id(UUID.randomUUID()).nome(email).email(email)
                .diasAviso(diasAviso).avisoVencimentoAtivo(avisoAtivo).build();
    }

    private static Boleto boleto(String descricao, LocalDate vencimento, Usuario responsavel) {
        return Boleto.builder().descricao(descricao).valor(new BigDecimal("10.00"))
                .dataVencimento(vencimento).responsavel(responsavel).build();
    }

    @Test
    void avisoRespeitaAntecedenciaEPreferenciaDeCadaUsuario() {
        Usuario ana = usuario("ana@email.com", 3, true);
        Usuario beto = usuario("beto@email.com", 15, true);
        Usuario caio = usuario("caio@email.com", 7, false);
        Usuario duda = usuario("duda@email.com", 7, true);
        Boleto anaPerto = boleto("Luz", hoje.plusDays(2), ana);
        Boleto anaLonge = boleto("Agua", hoje.plusDays(10), ana);
        Boleto betoLonge = boleto("Gas", hoje.plusDays(10), beto);
        Boleto caioDesligado = boleto("Net", hoje.plusDays(1), caio);
        Boleto dudaFalha = boleto("Tel", hoje.plusDays(1), duda);
        when(boletoRepo.findByDataPagamentoIsNullAndNotificadoEmIsNullAndDataVencimentoLessThanEqual(hoje.plusDays(30)))
                .thenReturn(List.of(anaPerto, anaLonge, betoLonge, caioDesligado, dudaFalha));
        doThrow(new RuntimeException("SMTP fora")).when(email).enviar(eq("duda@email.com"), anyString(), anyString());

        service.enviarAvisos(hoje);

        verify(email).enviar(eq("ana@email.com"), anyString(), contains("Luz"));
        verify(email).enviar(eq("beto@email.com"), anyString(), contains("Gas"));
        verify(email, never()).enviar(eq("caio@email.com"), anyString(), anyString());
        assertThat(anaPerto.getNotificadoEm()).isEqualTo(hoje);
        assertThat(anaLonge.getNotificadoEm()).isNull();
        assertThat(betoLonge.getNotificadoEm()).isEqualTo(hoje);
        assertThat(caioDesligado.getNotificadoEm()).isNull();
        assertThat(dudaFalha.getNotificadoEm()).isNull();
    }

    @Test
    void resumoSemanalVaiSoParaQuemAtivou() {
        Usuario ana = usuario("ana@email.com", 7, true);
        when(usuarioRepo.findByResumoSemanalAtivoTrue()).thenReturn(List.of(ana));
        when(boletoService.dashboard("ana@email.com"))
                .thenReturn(new DashboardResponse(1, 2, new BigDecimal("150.50"), BigDecimal.ZERO));
        when(boletoRepo.findByResponsavelEmail("ana@email.com")).thenReturn(List.of(boleto("Luz", hoje.plusDays(2), ana)));

        service.enviarResumosSemanais(hoje);

        verify(email).enviar(eq("ana@email.com"), eq("Seu resumo semanal - BillWatch"), contains("Atrasados: 1"));
        verify(email).enviar(eq("ana@email.com"), anyString(), contains("Luz"));
        verifyNoMoreInteractions(email);
    }
}
