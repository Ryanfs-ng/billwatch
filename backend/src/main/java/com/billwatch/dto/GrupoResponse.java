package com.billwatch.dto;

import com.billwatch.domain.Grupo;

import java.util.List;
import java.util.UUID;

public record GrupoResponse(UUID id, String nome, String codigoConvite, List<UsuarioResponse> membros) {
    public static GrupoResponse of(Grupo grupo, List<UsuarioResponse> membros) {
        return new GrupoResponse(grupo.getId(), grupo.getNome(), grupo.getCodigoConvite(), membros);
    }
}
