package com.billwatch.controller;

import com.billwatch.dto.BoletoRequest;
import com.billwatch.dto.BoletoResponse;
import com.billwatch.service.BoletoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

// Endpoints: GET /boletos/meus, GET /boletos, POST /boletos, PUT /boletos/{id},
// PATCH /boletos/{id}/pagar, DELETE /boletos/{id}, GET /boletos/dashboard (a implementar).
@RestController
@RequestMapping("/boletos")
@RequiredArgsConstructor
public class BoletoController {

    private final BoletoService boletoService;

    @GetMapping("/meus-boletos")
    public List<BoletoResponse> listarMeusBoletos(Authentication auth){
        return boletoService.listarMeusBoletos(auth.getName());
    }

    @GetMapping
    public List<BoletoResponse> listarTodosBoletos(){
        return boletoService.listarTodosBoletos();
    }

   @PostMapping
   @ResponseStatus(HttpStatus.CREATED)
    public BoletoResponse criar (@Valid @RequestBody BoletoRequest boleto, Authentication auth){
        return boletoService.criar(boleto, auth.getName());
   }

   @PutMapping("/{id}")
   public BoletoResponse editar(@PathVariable UUID id, @Valid @RequestBody BoletoRequest dados){
        return boletoService.editarBoleto(id, dados);
   }

   @PatchMapping("/{id}/pagar")
    public BoletoResponse pagar(@PathVariable UUID id) {
        return boletoService.pagarBoleto(id);
   }

   @DeleteMapping("/{id}")
   @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar (@PathVariable UUID id) {
        boletoService.deletarBoleto(id);
   }
}
