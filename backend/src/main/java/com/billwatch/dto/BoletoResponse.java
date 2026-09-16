package com.billwatch.dto;

import com.billwatch.domain.Boleto;
import com.billwatch.domain.StatusBoleto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record BoletoResponse(
        UUID id,
        String descricao,
        BigDecimal valor,
        LocalDate dataVencimento,
        Instant dataAnexado,
        LocalDate dataPagamento,
        String anexo,
        UUID responsavelId,
        String responsavelNome,
        StatusBoleto status
) {
    public static BoletoResponse of(Boleto boleto, StatusBoleto status) {
        return new BoletoResponse(
                boleto.getId(),
                boleto.getDescricao(),
                boleto.getValor(),
                boleto.getDataVencimento(),
                boleto.getDataAnexado(),
                boleto.getDataPagamento(),
                boleto.getAnexo(),
                boleto.getResponsavel().getId(),
                boleto.getResponsavel().getNome(),
                status
        );
    }
}
