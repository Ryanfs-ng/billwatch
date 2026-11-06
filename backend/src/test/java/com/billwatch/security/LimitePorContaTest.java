package com.billwatch.security;

import com.billwatch.security.LimitePorConta.Regra;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LimitePorContaTest {

    @RestController
    static class Controller {
        private final LimitePorConta limite = new LimitePorConta();

        @PostMapping("/enviar")
        public void enviar(@RequestParam String email) {
            limite.consumir(new Regra("teste", 1, Duration.ofMinutes(10)), email);
        }
    }

    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new Controller()).build();

    @Test
    void respondeTooManyRequestsComRetryAfterIgnorandoMaiusculas() throws Exception {
        mvc.perform(post("/enviar").param("email", "ryan@email.com")).andExpect(status().isOk());

        mvc.perform(post("/enviar").param("email", " RYAN@email.com "))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", matchesPattern("\\d+")));

        mvc.perform(post("/enviar").param("email", "outra@email.com")).andExpect(status().isOk());
    }
}
