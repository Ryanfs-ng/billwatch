package com.billwatch.service;

import com.billwatch.domain.Usuario;
import com.billwatch.dto.AuthResponse;
import com.billwatch.dto.LoginRequest;
import com.billwatch.dto.NotificacoesRequest;
import com.billwatch.dto.PerfilResponse;
import com.billwatch.dto.RegistrarRequest;
import com.billwatch.dto.UsuarioResponse;
import com.billwatch.repository.UsuarioRepository;
import com.billwatch.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final ArquivoService arquivoService;

    private static final Map<String, String> TIPOS_FOTO = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    @Value("${app.link-reset-senha}")
    private String linkResetSenha;

    public AuthResponse registrar (RegistrarRequest dados) {
        if (usuarioRepository.existsByEmail(dados.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado");
        }

        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .nome(dados.nome())
                .email(dados.email())
                .senha(passwordEncoder.encode(dados.senha()))
                .build());
        return new AuthResponse(jwtService.gerarToken(usuario.getEmail(), usuario.getNome()));
    }

    public AuthResponse login (LoginRequest dados) {
        Usuario usuario = usuarioRepository.findByEmail(dados.email())
                .filter(u -> passwordEncoder.matches(dados.senha(),
                        u.getSenha()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas"));
        return new AuthResponse(jwtService.gerarToken(usuario.getEmail(), usuario.getNome()));
    }

    public List<UsuarioResponse> listarUsuarios(String email) {
        Usuario logado = usuarioRepository.findByEmail(email).orElseThrow();
        List<Usuario> visiveis = logado.getGrupo() == null
                ? List.of(logado)
                : usuarioRepository.findByGrupoIdOrderByNome(logado.getGrupo().getId());
        return visiveis.stream().map(UsuarioResponse::of).toList();
    }

    public void esqueciSenha(String email) {
        usuarioRepository.findByEmail(email).ifPresent(usuario -> {
            String token = UUID.randomUUID() + UUID.randomUUID().toString();
            usuario.setResetTokenHash(sha256(token));
            usuario.setResetTokenExpira(Instant.now().plus(30, ChronoUnit.MINUTES));
            usuarioRepository.save(usuario);
            emailService.enviar(email, "Redefinição de senha - Billwatch", "Clique para redefinir sua senha: " + linkResetSenha + "?token=" + token
                    + "\nO link expira em 30 minutos.");
        });
    }

    public void redefinirSenha(String token, String novaSenha){
        Usuario usuario = usuarioRepository.findByResetTokenHash(sha256(token))
                .filter(u -> u.getResetTokenExpira().isAfter(Instant.now()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token inválido ou expirado"));
        trocarSenha(usuario, novaSenha);
        usuarioRepository.save(usuario);
    }

    public PerfilResponse perfil(String email) {
        return PerfilResponse.of(usuarioLogado(email));
    }

    public AuthResponse alterarEmail(String email, String novoEmail, String senhaAtual) {
        Usuario usuario = usuarioComSenhaConferida(email, senhaAtual);
        if (!novoEmail.equalsIgnoreCase(email) && usuarioRepository.existsByEmail(novoEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado");
        }
        usuario.setEmail(novoEmail);
        usuario.setCredenciaisAlteradasEm(agoraEmSegundos());
        usuarioRepository.save(usuario);
        return new AuthResponse(jwtService.gerarToken(usuario.getEmail(), usuario.getNome()));
    }

    public AuthResponse alterarSenha(String email, String senhaAtual, String novaSenha) {
        Usuario usuario = usuarioComSenhaConferida(email, senhaAtual);
        trocarSenha(usuario, novaSenha);
        usuarioRepository.save(usuario);
        return new AuthResponse(jwtService.gerarToken(usuario.getEmail(), usuario.getNome()));
    }

    public PerfilResponse alterarNotificacoes(String email, NotificacoesRequest dados) {
        Usuario usuario = usuarioLogado(email);
        usuario.setDiasAviso(dados.diasAviso());
        usuario.setAvisoVencimentoAtivo(dados.avisoVencimentoAtivo());
        usuario.setResumoSemanalAtivo(dados.resumoSemanalAtivo());
        return PerfilResponse.of(usuarioRepository.save(usuario));
    }

    public PerfilResponse alterarFoto(String email, MultipartFile arquivo) throws IOException {
        Usuario usuario = usuarioLogado(email);
        String nome = arquivoService.salvar(arquivo, TIPOS_FOTO, "Envie uma imagem JPG, PNG ou WEBP");
        arquivoService.apagar(usuario.getFoto());
        usuario.setFoto(nome);
        return PerfilResponse.of(usuarioRepository.save(usuario));
    }

    public void removerFoto(String email) throws IOException {
        Usuario usuario = usuarioLogado(email);
        arquivoService.apagar(usuario.getFoto());
        usuario.setFoto(null);
        usuarioRepository.save(usuario);
    }

    public Resource carregarFoto(UUID id, String email) {
        Usuario logado = usuarioLogado(email);
        String foto = usuarioRepository.findById(id).filter(logado::podeVer).map(Usuario::getFoto).orElse(null);
        return arquivoService.carregar(foto, "Usuário sem foto");
    }

    private Usuario usuarioLogado(String email) {
        return usuarioRepository.findByEmail(email).orElseThrow();
    }

    private Usuario usuarioComSenhaConferida(String email, String senhaAtual) {
        Usuario usuario = usuarioLogado(email);
        if (!passwordEncoder.matches(senhaAtual, usuario.getSenha())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Senha atual incorreta");
        }
        return usuario;
    }

    private void trocarSenha(Usuario usuario, String novaSenha) {
        usuario.setSenha(passwordEncoder.encode(novaSenha));
        usuario.setResetTokenHash(null);
        usuario.setResetTokenExpira(null);
        usuario.setCredenciaisAlteradasEm(agoraEmSegundos());
    }

    private static Instant agoraEmSegundos() {
        return Instant.now().truncatedTo(ChronoUnit.SECONDS);
    }

    private String sha256(String texto) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(texto.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
