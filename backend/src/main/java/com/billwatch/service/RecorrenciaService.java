package com.billwatch.service;

import com.billwatch.domain.Boleto;
import com.billwatch.repository.BoletoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class RecorrenciaService {

    private final BoletoRepository boletoRepository;

    @Scheduled(cron = "${boletos.recorrencia-cron}", zone = "America/Sao_Paulo")
    public void executar() {
        gerarProximos(LocalDate.now());
    }

    @Transactional
    public int gerarProximos(LocalDate hoje) {
        LocalDate inicioDoProximoMes = hoje.withDayOfMonth(1).plusMonths(1);
        int criados = 0;
        for (Boleto pendente : boletoRepository.findByRecorrenteTrueAndProximoGeradoFalseAndDataVencimentoBefore(inicioDoProximoMes)) {
            Boleto origem = pendente;
            while (origem.getDataVencimento().isBefore(inicioDoProximoMes)) {
                Boleto proximo = proximo(origem);
                origem.setProximoGerado(true);
                boletoRepository.save(origem);
                boletoRepository.save(proximo);
                criados++;
                origem = proximo;
            }
        }
        return criados;
    }

    static LocalDate proximoVencimento(LocalDate vencimento, Integer diaRecorrencia) {
        LocalDate proximoMes = vencimento.plusMonths(1);
        int dia = diaRecorrencia != null ? diaRecorrencia : vencimento.getDayOfMonth();
        return proximoMes.withDayOfMonth(Math.min(dia, proximoMes.lengthOfMonth()));
    }

    private static Boleto proximo(Boleto origem) {
        int dia = origem.getDiaRecorrencia() != null ? origem.getDiaRecorrencia() : origem.getDataVencimento().getDayOfMonth();
        return Boleto.builder()
                .descricao(origem.getDescricao())
                .valor(origem.getValor())
                .responsavel(origem.getResponsavel())
                .dataVencimento(proximoVencimento(origem.getDataVencimento(), dia))
                .recorrente(true)
                .diaRecorrencia(dia)
                .build();
    }
}
