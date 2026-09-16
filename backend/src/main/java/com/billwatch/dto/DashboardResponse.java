package com.billwatch.dto;

import java.math.BigDecimal;

public record DashboardResponse(
        long totalAtrasados,
        long totalAVencer,
        BigDecimal somaEmAberto,
        BigDecimal somaPagaNoMes
) {
}
