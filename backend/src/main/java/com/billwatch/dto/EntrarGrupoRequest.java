package com.billwatch.dto;

import jakarta.validation.constraints.NotBlank;

public record EntrarGrupoRequest(@NotBlank String codigo) {
}
