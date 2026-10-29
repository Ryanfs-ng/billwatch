package com.billwatch.service;

import com.billwatch.domain.Boleto;
import com.billwatch.domain.StatusBoleto;
import com.billwatch.domain.Usuario;
import com.billwatch.dto.BoletoRequest;
import com.billwatch.dto.BoletoResponse;
import com.billwatch.dto.DashboardResponse;
import com.billwatch.repository.BoletoRepository;
import com.billwatch.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BoletoService {

    private final BoletoRepository boletoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ArquivoService arquivoService;

    @Value("${boletos.dias-aviso}")
    private int diasAviso;

    private static final Map<String, String> TIPOS_ACEITOS = Map.of(
            "application/pdf", ".pdf",
            "image/jpeg", ".jpg",
            "image/png", ".png"
    );

    public StatusBoleto calcularStatus(Boleto boleto, LocalDate hoje){
        if (boleto.getDataPagamento() != null) return StatusBoleto.PAGO;
        if (boleto.getDataVencimento().isBefore(hoje)) return StatusBoleto.ATRASADO;
        if (!boleto.getDataVencimento().isAfter(hoje.plusDays(diasAviso))) return StatusBoleto.A_VENCER;
        return StatusBoleto.PENDENTE;
    }

    private BoletoResponse entidadeParaResponse(Boleto boleto){
        return BoletoResponse.of(boleto, calcularStatus(boleto, LocalDate.now()));
    }

    public BoletoResponse criar(BoletoRequest dados, String emailLogado){
        Usuario logado = usuarioLogado(emailLogado);
        Usuario responsavel = dados.responsavelId() != null ? buscarResponsavel(dados.responsavelId(), logado) : logado;

        return entidadeParaResponse(boletoRepository.save(Boleto.builder()
                .descricao(dados.descricao())
                .valor(dados.valor())
                .dataVencimento(dados.dataVencimento())
                .responsavel(responsavel)
                .build()));

    }

    public List<BoletoResponse> listarMeusBoletos(String email) {
        return boletoRepository.findByResponsavelEmail(email).stream().map(this::entidadeParaResponse).toList();
    }

    public List<BoletoResponse> listarTodosBoletos(String email){
        Usuario logado = usuarioLogado(email);
        List<Boleto> boletos = logado.getGrupo() == null
                ? boletoRepository.findByResponsavelEmail(email)
                : boletoRepository.findByResponsavelGrupoId(logado.getGrupo().getId());
        return boletos.stream().map(this::entidadeParaResponse).toList();
    }

    private Usuario usuarioLogado(String email) {
        return usuarioRepository.findByEmail(email).orElseThrow();
    }

    private Boleto buscar(UUID id, String email){
        Usuario logado = usuarioLogado(email);
        return boletoRepository.findById(id)
                .filter(b -> logado.podeVer(b.getResponsavel()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Boleto não encontrado"));
    }

    private Usuario buscarResponsavel(UUID id, Usuario logado){
        return usuarioRepository.findById(id)
                .filter(logado::podeVer)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuário não encontrado"));
    }

    public BoletoResponse editarBoleto(UUID id, BoletoRequest dados, String email) {
        Boleto boleto = buscar(id, email);
        boleto.setDescricao(dados.descricao());
        if (!dados.dataVencimento().equals(boleto.getDataVencimento())) {
            boleto.setNotificadoEm(null);
        }
        boleto.setDataVencimento(dados.dataVencimento());
        boleto.setValor(dados.valor());
        if (dados.responsavelId() != null) {
            boleto.setResponsavel(buscarResponsavel(dados.responsavelId(), usuarioLogado(email)));
        }
        return entidadeParaResponse(boletoRepository.save(boleto));
    }

    public DashboardResponse dashboard(String email) {
        LocalDate hoje = LocalDate.now();
        YearMonth mesAtual = YearMonth.from(hoje);
        long atrasados = 0;
        long aVencer = 0;
        BigDecimal emAberto = BigDecimal.ZERO;
        BigDecimal pagoNoMes = BigDecimal.ZERO;

        for (Boleto boleto : boletoRepository.findByResponsavelEmail(email)) {
            StatusBoleto status = calcularStatus(boleto, hoje);
            if (status == StatusBoleto.ATRASADO) atrasados++;
            if (status == StatusBoleto.A_VENCER) aVencer++;
            if (status != StatusBoleto.PAGO) {
                emAberto = emAberto.add(boleto.getValor());
            } else if (YearMonth.from(boleto.getDataPagamento()).equals(mesAtual)) {
                pagoNoMes = pagoNoMes.add(boleto.getValor());
            }
        }
        return new DashboardResponse(atrasados, aVencer, emAberto, pagoNoMes);
    }

    public BoletoResponse pagarBoleto (UUID id, String email) {
        Boleto boleto = buscar(id, email);
        if (boleto.getDataPagamento() != null){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Boleto já está pago");
        }
            boleto.setDataPagamento(LocalDate.now());
            return entidadeParaResponse(boletoRepository.save(boleto));
    }

    public void deletarBoleto (UUID id, String email) throws IOException {
        Boleto boleto = buscar(id, email);
        boletoRepository.deleteById(id);
        arquivoService.apagar(boleto.getAnexo());
    }

    public BoletoResponse anexar(UUID id, MultipartFile arquivo, String email) throws IOException {
        Boleto boleto = buscar(id, email);
        String nome = arquivoService.salvar(arquivo, TIPOS_ACEITOS, "Envie PDF, JPG ou PNG");
        arquivoService.apagar(boleto.getAnexo());
        boleto.setAnexo(nome);
        return entidadeParaResponse(boletoRepository.save(boleto));
    }

    public Resource carregarAnexo(UUID id, String email){
        return arquivoService.carregar(buscar(id, email).getAnexo(), "Boleto sem anexo");
    }
}
