package com.billwatch.service;

import com.billwatch.domain.CadastroPendente;
import com.billwatch.domain.Usuario;
import com.billwatch.dto.AuthResponse;
import com.billwatch.dto.LoginRequest;
import com.billwatch.dto.NotificacoesRequest;
import com.billwatch.dto.PerfilResponse;
import com.billwatch.dto.RegistrarRequest;
import com.billwatch.dto.UsuarioResponse;
import com.billwatch.repository.CadastroPendenteRepository;
import com.billwatch.repository.UsuarioRepository;
import com.billwatch.security.JwtService;
import com.billwatch.security.LimitePorConta;
import com.billwatch.security.LimitePorConta.Regra;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
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
    private final CadastroPendenteRepository cadastroPendenteRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final ArquivoService arquivoService;
    private final LimitePorConta limitePorConta;

    private static final Regra SENHA_ERRADA = new Regra("senha-errada", 5, Duration.ofMinutes(15));
    private static final Regra EMAIL_ENVIADO = new Regra("email-enviado", 5, Duration.ofHours(1));

    private static final Map<String, String> TIPOS_FOTO = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    @Value("${app.link-reset-senha}")
    private String linkResetSenha;

    @Value("${app.link-confirmar-email}")
    private String linkConfirmarEmail;

    @Value("${app.link-confirmar-novo-email}")
    private String linkConfirmarNovoEmail;

    @Transactional
    public void registrar (RegistrarRequest dados) {
        if (usuarioRepository.existsByEmail(dados.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado");
        }
        limitePorConta.consumir(EMAIL_ENVIADO, dados.email());
        cadastroPendenteRepository.deleteByExpiraEmBefore(Instant.now());

        String token = novoToken();
        CadastroPendente pendente = cadastroPendenteRepository.findByEmail(dados.email()).orElseGet(CadastroPendente::new);
        pendente.setNome(dados.nome());
        pendente.setEmail(dados.email());
        pendente.setSenha(passwordEncoder.encode(dados.senha()));
        pendente.setTokenHash(sha256(token));
        pendente.setExpiraEm(Instant.now().plus(24, ChronoUnit.HOURS));
        cadastroPendenteRepository.save(pendente);

        emailService.enviar(dados.email(), "Confirme seu e-mail - BillWatch",
                "Olá, " + dados.nome() + "! Clique para ativar sua conta: " + linkConfirmarEmail + "?token=" + token
                        + "\nO link expira em 24 horas. Se você não criou uma conta no BillWatch, ignore este e-mail.");
    }

    @Transactional
    public AuthResponse confirmarEmail(String token) {
        CadastroPendente pendente = cadastroPendenteRepository.findByTokenHash(sha256(token))
                .filter(p -> p.getExpiraEm().isAfter(Instant.now()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Link de confirmação inválido ou expirado"));
        if (usuarioRepository.existsByEmail(pendente.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado");
        }

        Usuario usuario = usuarioRepository.save(Usuario.builder()
                .nome(pendente.getNome())
                .email(pendente.getEmail())
                .senha(pendente.getSenha())
                .build());
        cadastroPendenteRepository.delete(pendente);
        return new AuthResponse(jwtService.gerarToken(usuario.getEmail(), usuario.getNome()));
    }

    public AuthResponse login (LoginRequest dados) {
        limitePorConta.exigirDisponivel(SENHA_ERRADA, dados.email());
        Usuario usuario = usuarioRepository.findByEmail(dados.email())
                .filter(u -> passwordEncoder.matches(dados.senha(),
                        u.getSenha()))
                .orElseThrow(() -> falhaDeLogin(dados));
        return new AuthResponse(jwtService.gerarToken(usuario.getEmail(), usuario.getNome()));
    }

    private ResponseStatusException falhaDeLogin(LoginRequest dados) {
        boolean aguardandoConfirmacao = cadastroPendenteRepository.findByEmail(dados.email())
                .filter(p -> passwordEncoder.matches(dados.senha(), p.getSenha()))
                .isPresent();
        if (aguardandoConfirmacao) {
            return new ResponseStatusException(HttpStatus.FORBIDDEN, "Confirme seu e-mail pelo link que enviamos para ativar a conta");
        }
        limitePorConta.registrar(SENHA_ERRADA, dados.email());
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Credenciais inválidas");
    }

    public List<UsuarioResponse> listarUsuarios(String email) {
        Usuario logado = usuarioRepository.findByEmail(email).orElseThrow();
        List<Usuario> visiveis = logado.getGrupo() == null
                ? List.of(logado)
                : usuarioRepository.findByGrupoIdOrderByNome(logado.getGrupo().getId());
        return visiveis.stream().map(UsuarioResponse::of).toList();
    }

    public void esqueciSenha(String email) {
        limitePorConta.consumir(EMAIL_ENVIADO, email);
        usuarioRepository.findByEmail(email).ifPresent(usuario -> {
            String token = novoToken();
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

    @Transactional
    public void alterarEmail(String email, String novoEmail, String senhaAtual) {
        Usuario usuario = usuarioComSenhaConferida(email, senhaAtual);
        if (novoEmail.equalsIgnoreCase(email) || usuarioRepository.existsByEmail(novoEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado");
        }
        limitePorConta.consumir(EMAIL_ENVIADO, novoEmail);
        String token = novoToken();
        usuario.setEmailPendente(novoEmail);
        usuario.setEmailTokenHash(sha256(token));
        usuario.setEmailTokenExpira(Instant.now().plus(24, ChronoUnit.HOURS));
        usuarioRepository.save(usuario);

        emailService.enviar(novoEmail, "Confirme seu novo e-mail - BillWatch",
                "Olá, " + usuario.getNome() + "! Clique para confirmar a troca do e-mail da sua conta: " + linkConfirmarNovoEmail + "?token=" + token
                        + "\nO link expira em 24 horas. Se você não pediu essa troca, ignore este e-mail.");
    }

    @Transactional
    public AuthResponse confirmarNovoEmail(String token) {
        Usuario usuario = usuarioRepository.findByEmailTokenHash(sha256(token))
                .filter(u -> u.getEmailTokenExpira().isAfter(Instant.now()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Link de confirmação inválido ou expirado"));
        String novoEmail = usuario.getEmailPendente();
        if (usuarioRepository.existsByEmail(novoEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado");
        }

        String emailAnterior = usuario.getEmail();
        usuario.setEmail(novoEmail);
        usuario.setEmailPendente(null);
        usuario.setEmailTokenHash(null);
        usuario.setEmailTokenExpira(null);
        usuario.setCredenciaisAlteradasEm(agoraEmSegundos());
        usuarioRepository.save(usuario);

        emailService.enviar(emailAnterior, "Seu e-mail foi alterado - BillWatch",
                "O e-mail da sua conta BillWatch foi alterado para " + novoEmail + ". A partir de agora, use esse endereço para entrar.");
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

    private static String novoToken() {
        return UUID.randomUUID() + UUID.randomUUID().toString();
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
