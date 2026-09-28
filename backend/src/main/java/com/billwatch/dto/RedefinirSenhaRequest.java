package com.billwatch.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RedefinirSenhaRequest(@NotBlank String token, @NotBlank @Size(min = 8) String novaSenha) {
}
