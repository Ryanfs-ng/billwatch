package com.billwatch.dto;

import com.billwatch.domain.Usuario;

import java.util.UUID;

public record UsuarioResponse(UUID id, String nome, String email, boolean temFoto) {
    public static UsuarioResponse of(Usuario usuario) {
        return new UsuarioResponse(usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.getFoto() != null);
    }
}
