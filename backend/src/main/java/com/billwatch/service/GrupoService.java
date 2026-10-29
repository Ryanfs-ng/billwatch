package com.billwatch.service;

import com.billwatch.domain.Grupo;
import com.billwatch.domain.Usuario;
import com.billwatch.dto.GrupoResponse;
import com.billwatch.dto.UsuarioResponse;
import com.billwatch.repository.GrupoRepository;
import com.billwatch.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class GrupoService {

    private static final String ALFABETO_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final GrupoRepository grupoRepository;
    private final UsuarioRepository usuarioRepository;

    public Optional<GrupoResponse> meuGrupo(String email) {
        return Optional.ofNullable(usuarioLogado(email).getGrupo()).map(this::paraResponse);
    }

    @Transactional
    public GrupoResponse criar(String nome, String email) {
        Usuario usuario = usuarioSemGrupo(email);
        Grupo grupo = grupoRepository.save(Grupo.builder().nome(nome.trim()).codigoConvite(gerarCodigo()).build());
        usuario.setGrupo(grupo);
        usuarioRepository.save(usuario);
        return paraResponse(grupo);
    }

    @Transactional
    public GrupoResponse entrar(String codigo, String email) {
        Usuario usuario = usuarioSemGrupo(email);
        Grupo grupo = grupoRepository.findByCodigoConvite(codigo.trim().toUpperCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Código de convite inválido"));
        usuario.setGrupo(grupo);
        usuarioRepository.save(usuario);
        return paraResponse(grupo);
    }

    @Transactional
    public void sair(String email) {
        Usuario usuario = usuarioLogado(email);
        Grupo grupo = usuario.getGrupo();
        if (grupo == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Você não participa de um grupo");
        }
        usuario.setGrupo(null);
        usuarioRepository.saveAndFlush(usuario);
        if (!usuarioRepository.existsByGrupoId(grupo.getId())) {
            grupoRepository.delete(grupo);
        }
    }

    @Transactional
    public GrupoResponse gerarNovoCodigo(String email) {
        Grupo grupo = Optional.ofNullable(usuarioLogado(email).getGrupo())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "Você não participa de um grupo"));
        grupo.setCodigoConvite(gerarCodigo());
        return paraResponse(grupoRepository.save(grupo));
    }

    private Usuario usuarioLogado(String email) {
        return usuarioRepository.findByEmail(email).orElseThrow();
    }

    private Usuario usuarioSemGrupo(String email) {
        Usuario usuario = usuarioLogado(email);
        if (usuario.getGrupo() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Você já participa de um grupo");
        }
        return usuario;
    }

    private GrupoResponse paraResponse(Grupo grupo) {
        return GrupoResponse.of(grupo, usuarioRepository.findByGrupoIdOrderByNome(grupo.getId()).stream()
                .map(UsuarioResponse::of).toList());
    }

    private static String gerarCodigo() {
        StringBuilder codigo = new StringBuilder();
        for (int i = 0; i < 8; i++) {
            codigo.append(ALFABETO_CODIGO.charAt(RANDOM.nextInt(ALFABETO_CODIGO.length())));
        }
        return codigo.toString();
    }
}
