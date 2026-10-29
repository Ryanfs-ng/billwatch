package com.billwatch.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Component
public class LimiteTentativasInterceptor implements HandlerInterceptor {

    private final Cache<String, Bucket> baldes = Caffeine.newBuilder()
            .expireAfterAccess(Duration.ofHours(2))
            .maximumSize(100_000)
            .build();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod metodo)) {
            return true;
        }
        LimiteTentativas limite = metodo.getMethodAnnotation(LimiteTentativas.class);
        if (limite == null) {
            return true;
        }

        String chave = metodo.getMethod().toGenericString() + "|" + request.getRemoteAddr();
        ConsumptionProbe tentativa = baldes.get(chave, k -> novoBalde(limite)).tryConsumeAndReturnRemaining(1);
        if (tentativa.isConsumed()) {
            return true;
        }

        long segundos = Math.max(1, TimeUnit.NANOSECONDS.toSeconds(tentativa.getNanosToWaitForRefill()));
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setHeader("Retry-After", String.valueOf(segundos));
        return false;
    }

    private static Bucket novoBalde(LimiteTentativas limite) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(limite.maximo())
                        .refillGreedy(limite.maximo(), Duration.ofMinutes(limite.periodoMinutos()))
                        .build())
                .build();
    }
}
