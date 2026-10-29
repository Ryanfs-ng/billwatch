package com.billwatch.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GrupoRequest(@NotBlank @Size(max = 100) String nome) {
}
