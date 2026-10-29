package com.billwatch.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record NotificacoesRequest(
        @Min(1) @Max(30) int diasAviso,
        boolean avisoVencimentoAtivo,
        boolean resumoSemanalAtivo
) {
}
