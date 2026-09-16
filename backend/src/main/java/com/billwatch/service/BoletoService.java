package com.billwatch.service;

import com.billwatch.repository.BoletoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

// Regras de negocio (calculo de status, notificacao) a implementar na proxima etapa.
@Service
@RequiredArgsConstructor
public class BoletoService {

    private final BoletoRepository boletoRepository;
}
