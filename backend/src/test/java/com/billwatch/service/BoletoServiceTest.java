package com.billwatch.service;

import com.billwatch.domain.Boleto;
import com.billwatch.dto.DashboardResponse;
import com.billwatch.repository.BoletoRepository;
import com.billwatch.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class BoletoServiceTest {

    private static Boleto boleto(String valor, LocalDate vencimento, LocalDate pagamento) {
        return Boleto.builder().valor(new BigDecimal(valor)).dataVencimento(vencimento).dataPagamento(pagamento).build();
    }

    @Test
    void dashboardAgregaPorStatus() {
        BoletoRepository repo = mock(BoletoRepository.class);
        BoletoService service = new BoletoService(repo, mock(UsuarioRepository.class));
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
}
