package com.billwatch.service;

import com.billwatch.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

// Cadastro/autenticacao de usuarios a implementar na proxima etapa.
@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
}
