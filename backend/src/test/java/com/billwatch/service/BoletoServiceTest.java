package com.billwatch.service;

import com.billwatch.domain.Boleto;
import com.billwatch.domain.Usuario;
import com.billwatch.dto.BoletoRequest;
import com.billwatch.dto.DashboardResponse;
import com.billwatch.repository.BoletoRepository;
import com.billwatch.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BoletoServiceTest {

    private static Boleto boleto(String valor, LocalDate vencimento, LocalDate pagamento) {
        return Boleto.builder().valor(new BigDecimal(valor)).dataVencimento(vencimento).dataPagamento(pagamento).build();
    }

    @Test
    void dashboardAgregaPorStatus() {
        BoletoRepository repo = mock(BoletoRepository.class);
        BoletoService service = new BoletoService(repo, mock(UsuarioRepository.class), mock(ArquivoService.class), mock(RecorrenciaService.class));
        ReflectionTestUtils.setField(service, "diasAviso", 7);

        LocalDate hoje = LocalDate.now();
        when(repo.findByResponsavelEmail("ryan@email.com")).thenReturn(List.of(
                boleto("100.00", hoje.minusDays(3), null),
                boleto("50.00", hoje.plusDays(2), null),
                boleto("20.00", hoje.plusDays(30), null),
                boleto("300.00", hoje.minusDays(1), hoje),
                boleto("999.00", hoje.minusMonths(2), hoje.minusMonths(2))
        ));

        DashboardResponse r = service.dashboard("ryan@email.com");

        assertThat(r.totalAtrasados()).isEqualTo(1);
        assertThat(r.totalAVencer()).isEqualTo(1);
        assertThat(r.somaEmAberto()).isEqualByComparingTo("170.00");
        assertThat(r.somaPagaNoMes()).isEqualByComparingTo("300.00");
    }

    private final Usuario ryan = Usuario.builder().id(UUID.randomUUID()).nome("Ryan").email("ryan@email.com").build();
    private final UUID serie = UUID.randomUUID();

    private Boleto daSerie(LocalDate vencimento, LocalDate pagamento) {
        return Boleto.builder().id(UUID.randomUUID()).descricao("Luz").valor(new BigDecimal("150.00")).responsavel(ryan)
                .dataVencimento(vencimento).dataPagamento(pagamento).recorrente(true).diaRecorrencia(10).serieId(serie).build();
    }

    private BoletoService serviceComSerie(BoletoRepository repo, Boleto editado, List<Boleto> proximos) {
        UsuarioRepository usuarios = mock(UsuarioRepository.class);
        when(usuarios.findByEmail("ryan@email.com")).thenReturn(Optional.of(ryan));
        when(repo.findById(editado.getId())).thenReturn(Optional.of(editado));
        when(repo.findBySerieIdAndDataVencimentoAfter(serie, editado.getDataVencimento())).thenReturn(proximos);
        when(repo.save(any())).thenAnswer(i -> i.getArgument(0));
        BoletoService service = new BoletoService(repo, usuarios, mock(ArquivoService.class), mock(RecorrenciaService.class));
        ReflectionTestUtils.setField(service, "diasAviso", 7);
        return service;
    }

    @Test
    void aplicaValorAosProximosEmAbertoQuandoPedido() {
        BoletoRepository repo = mock(BoletoRepository.class);
        Boleto novembro = daSerie(LocalDate.of(2026, 11, 10), null);
        Boleto dezembro = daSerie(LocalDate.of(2026, 12, 10), null);
        Boleto janeiroPago = daSerie(LocalDate.of(2027, 1, 10), LocalDate.of(2026, 11, 1));
        BoletoService service = serviceComSerie(repo, novembro, List.of(dezembro, janeiroPago));

        service.editarBoleto(novembro.getId(), new BoletoRequest("Luz", new BigDecimal("180.00"), novembro.getDataVencimento(), null, true, true), "ryan@email.com");

        assertThat(dezembro.getValor()).isEqualByComparingTo("180.00");
        assertThat(janeiroPago.getValor()).isEqualByComparingTo("150.00");
    }

    @Test
    void naoMexeNosProximosSemPedido() {
        BoletoRepository repo = mock(BoletoRepository.class);
        Boleto novembro = daSerie(LocalDate.of(2026, 11, 10), null);
        Boleto dezembro = daSerie(LocalDate.of(2026, 12, 10), null);
        BoletoService service = serviceComSerie(repo, novembro, List.of(dezembro));

        service.editarBoleto(novembro.getId(), new BoletoRequest("Luz", new BigDecimal("180.00"), novembro.getDataVencimento(), null, true, false), "ryan@email.com");

        assertThat(dezembro.getValor()).isEqualByComparingTo("150.00");
        assertThat(dezembro.isRecorrente()).isTrue();
    }

    @Test
    void desmarcarRecorrenciaEncerraOsProximos() {
        BoletoRepository repo = mock(BoletoRepository.class);
        Boleto novembro = daSerie(LocalDate.of(2026, 11, 10), null);
        Boleto dezembro = daSerie(LocalDate.of(2026, 12, 10), null);
        BoletoService service = serviceComSerie(repo, novembro, List.of(dezembro));

        service.editarBoleto(novembro.getId(), new BoletoRequest("Luz", new BigDecimal("150.00"), novembro.getDataVencimento(), null, false, false), "ryan@email.com");

        assertThat(novembro.isRecorrente()).isFalse();
        assertThat(dezembro.isRecorrente()).isFalse();
    }
}
