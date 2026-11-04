package com.billwatch.dto;

import com.billwatch.domain.Usuario;

import java.time.Instant;
import java.util.UUID;

public record PerfilResponse(
        UUID id,
        String nome,
        String email,
        boolean temFoto,
        int diasAviso,
        boolean avisoVencimentoAtivo,
        boolean resumoSemanalAtivo,
        String emailPendente
) {
    public static PerfilResponse of(Usuario usuario) {
        return new PerfilResponse(usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.getFoto() != null,
                usuario.getDiasAviso(), usuario.isAvisoVencimentoAtivo(), usuario.isResumoSemanalAtivo(),
                usuario.getEmailTokenExpira() != null && usuario.getEmailTokenExpira().isAfter(Instant.now()) ? usuario.getEmailPendente() : null);
    }
}
