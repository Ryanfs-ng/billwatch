package com.billwatch.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.EstimationProbe;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

@Component
public class LimitePorConta {

    public record Regra(String nome, int maximo, Duration periodo) {
    }

    private final Cache<String, Bucket> baldes = Caffeine.newBuilder()
            .expireAfterAccess(Duration.ofHours(2))
            .maximumSize(100_000)
            .build();

    public void exigirDisponivel(Regra regra, String conta) {
        EstimationProbe estimativa = balde(regra, conta).estimateAbilityToConsume(1);
        if (!estimativa.canBeConsumed()) {
            throw excedido(estimativa.getNanosToWaitForRefill());
        }
    }

    public void registrar(Regra regra, String conta) {
        balde(regra, conta).tryConsume(1);
    }

    public void consumir(Regra regra, String conta) {
        ConsumptionProbe tentativa = balde(regra, conta).tryConsumeAndReturnRemaining(1);
        if (!tentativa.isConsumed()) {
            throw excedido(tentativa.getNanosToWaitForRefill());
        }
    }

    private Bucket balde(Regra regra, String conta) {
        String chave = regra.nome() + "|" + conta.trim().toLowerCase(Locale.ROOT);
        return baldes.get(chave, k -> Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(regra.maximo())
                        .refillGreedy(regra.maximo(), regra.periodo())
                        .build())
                .build());
    }

    private static ResponseStatusException excedido(long nanosParaLiberar) {
        String segundos = String.valueOf(Math.max(1, TimeUnit.NANOSECONDS.toSeconds(nanosParaLiberar)));
        return new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Muitas tentativas") {
            @Override
            public HttpHeaders getHeaders() {
                HttpHeaders headers = new HttpHeaders();
                headers.set(HttpHeaders.RETRY_AFTER, segundos);
                return headers;
            }
        };
    }
}
