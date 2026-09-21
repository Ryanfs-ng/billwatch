package com.billwatch.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record BoletoRequest(
        @NotBlank String descricao,
        @Positive BigDecimal valor,
        @NotNull LocalDate dataVencimento,
        UUID responsavelId)
{ }
