package com.billwatch.service;

import com.billwatch.domain.Boleto;
import com.billwatch.domain.StatusBoleto;
import com.billwatch.domain.Usuario;
import com.billwatch.dto.DashboardResponse;
import com.billwatch.repository.BoletoRepository;
import com.billwatch.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificacaoService {

    static final int ANTECEDENCIA_MAXIMA = 30;
    private static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final NumberFormat MOEDA = NumberFormat.getCurrencyInstance(Locale.of("pt", "BR"));

    private final BoletoRepository boletoRepository;
    private final UsuarioRepository usuarioRepository;
    private final BoletoService boletoService;
    private final EmailService emailService;

    @Value("${app.url-frontend}")
    private String urlFrontend;

    @Scheduled(cron = "${boletos.aviso-cron}", zone = "America/Sao_Paulo")
    public void executarAvisos() {
        enviarAvisos(LocalDate.now());
    }

    @Scheduled(cron = "${boletos.resumo-cron}", zone = "America/Sao_Paulo")
    public void executarResumos() {
        enviarResumosSemanais(LocalDate.now());
    }

    public void enviarAvisos(LocalDate hoje) {
        Map<UUID, List<Boleto>> porResponsavel = boletoRepository
                .findByDataPagamentoIsNullAndNotificadoEmIsNullAndDataVencimentoLessThanEqual(hoje.plusDays(ANTECEDENCIA_MAXIMA))
                .stream()
                .filter(b -> b.getResponsavel().isAvisoVencimentoAtivo()
                        && !b.getDataVencimento().isAfter(hoje.plusDays(b.getResponsavel().getDiasAviso())))
                .collect(Collectors.groupingBy(b -> b.getResponsavel().getId()));

        porResponsavel.values().forEach(boletos -> {
            Usuario responsavel = boletos.getFirst().getResponsavel();
            try {
                emailService.enviar(responsavel.getEmail(), "Boletos perto do vencimento - BillWatch",
                        "Olá, %s!\n\nEstes boletos estão perto do vencimento ou atrasados:\n\n%s\n\nAcesse o BillWatch para conferir: %s"
                                .formatted(responsavel.getNome(), listar(boletos, hoje), urlFrontend));
                boletos.forEach(b -> b.setNotificadoEm(hoje));
                boletoRepository.saveAll(boletos);
            } catch (Exception e) {
                log.warn("Falha ao enviar aviso de vencimento para {}", responsavel.getEmail(), e);
            }
        });
    }

    public void enviarResumosSemanais(LocalDate hoje) {
        for (Usuario usuario : usuarioRepository.findByResumoSemanalAtivoTrue()) {
            try {
                DashboardResponse resumo = boletoService.dashboard(usuario.getEmail());
                List<Boleto> abertos = boletoRepository.findByResponsavelEmail(usuario.getEmail()).stream()
                        .filter(b -> b.getDataPagamento() == null)
                        .sorted(Comparator.comparing(Boleto::getDataVencimento))
                        .limit(5)
                        .toList();
                emailService.enviar(usuario.getEmail(), "Seu resumo semanal - BillWatch", """
                        Olá, %s! Este é o resumo dos seus boletos:

                        - Atrasados: %d
                        - Vencem em breve: %d
                        - Total em aberto: %s
                        - Pago este mês: %s

                        Próximos vencimentos:
                        %s

                        Acesse o BillWatch: %s""".formatted(usuario.getNome(), resumo.totalAtrasados(), resumo.totalAVencer(),
                        MOEDA.format(resumo.somaEmAberto()), MOEDA.format(resumo.somaPagaNoMes()),
                        abertos.isEmpty() ? "Nenhum boleto em aberto. Tudo em dia!" : listar(abertos, hoje), urlFrontend));
            } catch (Exception e) {
                log.warn("Falha ao enviar resumo semanal para {}", usuario.getEmail(), e);
            }
        }
    }

    private String listar(List<Boleto> boletos, LocalDate hoje) {
        return boletos.stream()
                .sorted(Comparator.comparing(Boleto::getDataVencimento))
                .map(b -> "- %s: %s, vence em %s%s".formatted(b.getDescricao(), MOEDA.format(b.getValor()),
                        DATA.format(b.getDataVencimento()),
                        boletoService.calcularStatus(b, hoje) == StatusBoleto.ATRASADO ? " (ATRASADO)" : ""))
                .collect(Collectors.joining("\n"));
    }
}
