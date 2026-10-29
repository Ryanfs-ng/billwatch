package com.billwatch.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AlterarEmailRequest(
        @NotBlank @Email(regexp = ".+@.+\\..+") String novoEmail,
        @NotBlank String senhaAtual
) {
}
