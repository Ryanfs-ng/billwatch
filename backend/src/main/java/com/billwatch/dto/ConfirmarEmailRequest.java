package com.billwatch.dto;

import jakarta.validation.constraints.NotBlank;

public record ConfirmarEmailRequest(@NotBlank String token) {
}
