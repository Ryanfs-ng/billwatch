package com.billwatch.dto;

import com.billwatch.domain.Usuario;

import java.util.UUID;

public record PerfilResponse(
        UUID id,
        String nome,
        String email,
        boolean temFoto,
        int diasAviso,
        boolean avisoVencimentoAtivo,
        boolean resumoSemanalAtivo
) {
    public static PerfilResponse of(Usuario usuario) {
        return new PerfilResponse(usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.getFoto() != null,
                usuario.getDiasAviso(), usuario.isAvisoVencimentoAtivo(), usuario.isResumoSemanalAtivo());
    }
}
