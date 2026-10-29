package com.billwatch.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.method.HandlerMethod;

import static org.assertj.core.api.Assertions.assertThat;

class LimiteTentativasInterceptorTest {

    static class Controller {
        @LimiteTentativas(maximo = 10, periodoMinutos = 1)
        public void login() {
        }

        public void livre() {
        }
    }

    private final LimiteTentativasInterceptor interceptor = new LimiteTentativasInterceptor();

    private static HandlerMethod handler(String metodo) throws NoSuchMethodException {
        return new HandlerMethod(new Controller(), Controller.class.getMethod(metodo));
    }

    private boolean chamar(HandlerMethod handler, String ip, MockHttpServletResponse response) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(ip);
        return interceptor.preHandle(request, response, handler);
    }

    @Test
    void bloqueiaAposOLimiteComRetryAfterSemAfetarOutroIp() throws Exception {
        HandlerMethod login = handler("login");
        for (int i = 0; i < 10; i++) {
            assertThat(chamar(login, "1.1.1.1", new MockHttpServletResponse())).isTrue();
        }

        MockHttpServletResponse bloqueada = new MockHttpServletResponse();
        assertThat(chamar(login, "1.1.1.1", bloqueada)).isFalse();
        assertThat(bloqueada.getStatus()).isEqualTo(429);
        assertThat(Long.parseLong(bloqueada.getHeader("Retry-After"))).isBetween(1L, 60L);

        assertThat(chamar(login, "2.2.2.2", new MockHttpServletResponse())).isTrue();
    }

    @Test
    void metodoSemAnotacaoNaoELimitado() throws Exception {
        HandlerMethod livre = handler("livre");
        for (int i = 0; i < 50; i++) {
            assertThat(chamar(livre, "1.1.1.1", new MockHttpServletResponse())).isTrue();
        }
    }
}
