package com.billwatch.service;

import com.billwatch.domain.Boleto;
import com.billwatch.domain.Usuario;
import com.billwatch.repository.BoletoRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RecorrenciaServiceTest {

    private final LocalDate hoje = LocalDate.of(2026, 11, 4);
    private final LocalDate inicioDezembro = LocalDate.of(2026, 12, 1);
    private final BoletoRepository repo = mock(BoletoRepository.class);
    private final RecorrenciaService service = new RecorrenciaService(repo);
    private final Usuario ryan = Usuario.builder().id(UUID.randomUUID()).nome("Ryan").email("ryan@email.com").build();

    private Boleto recorrente(LocalDate vencimento, int dia) {
        return Boleto.builder().id(UUID.randomUUID()).descricao("Aluguel").valor(new BigDecimal("1800.00"))
                .responsavel(ryan).dataVencimento(vencimento).recorrente(true).diaRecorrencia(dia)
                .anexo("contrato.pdf").dataPagamento(vencimento).build();
    }

    private List<Boleto> salvosNovos() {
        ArgumentCaptor<Boleto> salvos = ArgumentCaptor.forClass(Boleto.class);
        verify(repo, atLeastOnce()).save(salvos.capture());
        return salvos.getAllValues().stream().filter(b -> b.getId() == null).distinct().toList();
    }

    @Test
    void mantemODiaOriginalMesmoDepoisDeUmMesMaisCurto() {
        assertThat(RecorrenciaService.proximoVencimento(LocalDate.of(2026, 1, 31), 31)).isEqualTo(LocalDate.of(2026, 2, 28));
        assertThat(RecorrenciaService.proximoVencimento(LocalDate.of(2026, 2, 28), 31)).isEqualTo(LocalDate.of(2026, 3, 31));
        assertThat(RecorrenciaService.proximoVencimento(LocalDate.of(2026, 11, 10), 10)).isEqualTo(LocalDate.of(2026, 12, 10));
    }

    @Test
    void geraOMesSeguinteUmaVezSoSemAnexoNemPagamento() {
        Boleto novembro = recorrente(LocalDate.of(2026, 11, 10), 10);
        when(repo.findByRecorrenteTrueAndProximoGeradoFalseAndDataVencimentoBefore(inicioDezembro)).thenReturn(List.of(novembro));

        assertThat(service.gerarProximos(hoje)).isEqualTo(1);

        assertThat(novembro.isProximoGerado()).isTrue();
        Boleto dezembro = salvosNovos().get(0);
        assertThat(dezembro.getDataVencimento()).isEqualTo(LocalDate.of(2026, 12, 10));
        assertThat(dezembro.getDescricao()).isEqualTo("Aluguel");
        assertThat(dezembro.getValor()).isEqualByComparingTo("1800.00");
        assertThat(dezembro.getResponsavel()).isSameAs(ryan);
        assertThat(dezembro.isRecorrente()).isTrue();
        assertThat(dezembro.isProximoGerado()).isFalse();
        assertThat(dezembro.getAnexo()).isNull();
        assertThat(dezembro.getDataPagamento()).isNull();
    }

    @Test
    void recuperaMesesPerdidosAteFicarUmMesAFrente() {
        Boleto agosto = recorrente(LocalDate.of(2026, 8, 31), 31);
        when(repo.findByRecorrenteTrueAndProximoGeradoFalseAndDataVencimentoBefore(inicioDezembro)).thenReturn(List.of(agosto));

        assertThat(service.gerarProximos(hoje)).isEqualTo(4);

        assertThat(salvosNovos()).extracting(Boleto::getDataVencimento).containsExactly(
                LocalDate.of(2026, 9, 30), LocalDate.of(2026, 10, 31), LocalDate.of(2026, 11, 30), LocalDate.of(2026, 12, 31));
    }

    @Test
    void naoGeraNadaSemPendentes() {
        when(repo.findByRecorrenteTrueAndProximoGeradoFalseAndDataVencimentoBefore(any())).thenReturn(List.of());
        assertThat(service.gerarProximos(hoje)).isZero();
    }
}
