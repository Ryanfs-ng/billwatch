package com.billwatch.security;

import com.billwatch.config.WebConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.http.HttpMessageConvertersAutoConfiguration;
import org.springframework.boot.autoconfigure.web.embedded.EmbeddedWebServerFactoryCustomizerAutoConfiguration;
import org.springframework.boot.autoconfigure.web.servlet.DispatcherServletAutoConfiguration;
import org.springframework.boot.autoconfigure.web.servlet.ServletWebServerFactoryAutoConfiguration;
import org.springframework.boot.autoconfigure.web.servlet.WebMvcAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.boot.test.context.SpringBootTest.WebEnvironment.RANDOM_PORT;

@SpringBootConfiguration
@ImportAutoConfiguration({
        ServletWebServerFactoryAutoConfiguration.class,
        EmbeddedWebServerFactoryCustomizerAutoConfiguration.class,
        DispatcherServletAutoConfiguration.class,
        WebMvcAutoConfiguration.class,
        HttpMessageConvertersAutoConfiguration.class
})
@Import({LimiteTentativasInterceptor.class, WebConfig.class, AppDeTeste.Alvo.class})
class AppDeTeste {

    @RestController
    static class Alvo {
        @GetMapping("/alvo")
        @LimiteTentativas(maximo = 1, periodoMinutos = 60)
        String alvo() {
            return "ok";
        }
    }

    static int chamar(TestRestTemplate rest, String ip) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Forwarded-For", ip);
        return rest.exchange("/alvo", HttpMethod.GET, new HttpEntity<>(headers), String.class).getStatusCode().value();
    }
}

@SpringBootTest(classes = AppDeTeste.class, webEnvironment = RANDOM_PORT, properties = "server.forward-headers-strategy=native")
class IpAtrasDeProxyTest {

    @Autowired
    TestRestTemplate rest;

    @Test
    void comProxyLigadoCadaIpDoCabecalhoTemSeuProprioLimite() {
        assertThat(AppDeTeste.chamar(rest, "1.1.1.1")).isEqualTo(200);
        assertThat(AppDeTeste.chamar(rest, "1.1.1.1")).isEqualTo(429);
        assertThat(AppDeTeste.chamar(rest, "2.2.2.2")).isEqualTo(200);
    }
}

@SpringBootTest(classes = AppDeTeste.class, webEnvironment = RANDOM_PORT)
class IpSemProxyTest {

    @Autowired
    TestRestTemplate rest;

    @Test
    void desligadoPorPadraoOCabecalhoEIgnorado() {
        assertThat(AppDeTeste.chamar(rest, "3.3.3.3")).isEqualTo(200);
        assertThat(AppDeTeste.chamar(rest, "4.4.4.4")).isEqualTo(429);
    }
}
