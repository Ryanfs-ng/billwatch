package com.billwatch.service;

import com.billwatch.domain.Boleto;
import com.billwatch.domain.StatusBoleto;
import com.billwatch.domain.Usuario;
import com.billwatch.dto.BoletoRequest;
import com.billwatch.dto.BoletoResponse;
import com.billwatch.repository.BoletoRepository;
import com.billwatch.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

// Regras de negocio (calculo de status, notificacao) a implementar na proxima etapa.
@Service
@RequiredArgsConstructor
public class BoletoService {

    private final BoletoRepository boletoRepository;
    private final UsuarioRepository usuarioRepository;

    @Value("${boletos.dias-aviso}")
    private int diasAviso;

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
        Usuario responsavel = dados.responsavelId() != null
                ? usuarioRepository.findById(dados.responsavelId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuário não encontrado"))
                : usuarioRepository.findByEmail(emailLogado).orElseThrow();

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

    public List<BoletoResponse> listarTodosBoletos(){
        return boletoRepository.findAll().stream().map(this::entidadeParaResponse).toList();
    }

    private Boleto buscar (UUID id){
        return boletoRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuário não encontrado"));
    }

    private Usuario buscarResponsavel(UUID id){
        return usuarioRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Usuário não encontrado"));
    }

    public BoletoResponse editarBoleto(UUID id, BoletoRequest dados) {
        Boleto boleto = buscar(id);
        boleto.setDescricao(dados.descricao());
        boleto.setDataVencimento(dados.dataVencimento());
        boleto.setValor(dados.valor());
        if (dados.responsavelId() != null) {
            boleto.setResponsavel(buscarResponsavel(dados.responsavelId()));
        }
        return entidadeParaResponse(boletoRepository.save(boleto));
    }

    public BoletoResponse pagarBoleto (UUID id) {
        Boleto boleto = buscar(id);
        if (boleto.getDataPagamento() != null){
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Boleto já está pago");
        }
            boleto.setDataPagamento(LocalDate.now());
            return entidadeParaResponse(boletoRepository.save(boleto));
    }

    public void deletarBoleto (UUID id) {
        boletoRepository.deleteById(id);
    }
}
