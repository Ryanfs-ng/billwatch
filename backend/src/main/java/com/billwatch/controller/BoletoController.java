package com.billwatch.controller;

import com.billwatch.service.BoletoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Endpoints: GET /boletos/meus, GET /boletos, POST /boletos, PUT /boletos/{id},
// PATCH /boletos/{id}/pagar, DELETE /boletos/{id}, GET /boletos/dashboard (a implementar).
@RestController
@RequestMapping("/boletos")
@RequiredArgsConstructor
public class BoletoController {

    private final BoletoService boletoService;
}
