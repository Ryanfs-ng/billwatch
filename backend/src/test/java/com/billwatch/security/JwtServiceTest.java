package com.billwatch.security;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertThrows;

public class JwtServiceTest {

    private static final String SEGREDO =
            "dGVzdGUtdGVzdGUtdGVzdGUtdGVzdGUtdGVzdGUtdGVzdGUtdGVzdGUtdGVzdGU=";

    private JwtService service;

    @BeforeEach
    void setUp() {
        service = new JwtService();
        ReflectionTestUtils.setField(service, "secret", SEGREDO);
        ReflectionTestUtils.setField(service, "expiracaoMinutos", 60L);
    }

    @Test
    void geraEExtraiEmail() {
        String token = service.gerarToken("a@b.com");
        assertEquals("a@b.com", service.extrairEmail(token));
    }

    @Test
    void tokenExpiradoLancaExcecao() {
        ReflectionTestUtils.setField(service, "expiracaoMinutos", -1L);
        String token = service.gerarToken("a@b.com");
        assertThrows(JwtException.class, () -> service.extrairEmail(token));
    }
}
