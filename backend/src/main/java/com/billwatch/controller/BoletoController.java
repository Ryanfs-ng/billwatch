package com.billwatch.controller;

import com.billwatch.dto.BoletoRequest;
import com.billwatch.dto.BoletoResponse;
import com.billwatch.service.BoletoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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
    public void deletar (@PathVariable UUID id) throws IOException {
        boletoService.deletarBoleto(id);
   }

   @PutMapping(value = "/{id}/anexos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BoletoResponse anexar (@PathVariable UUID id, @RequestParam("arquivo")MultipartFile arquivo) throws IOException {
        return boletoService.anexar(id, arquivo);
   }

   @GetMapping("/{id}/anexo")
    public ResponseEntity<Resource> carregarAnexo(@PathVariable UUID id) {
       Resource recurso = boletoService.carregarAnexo(id);
       MediaType tipo = MediaTypeFactory.getMediaType(recurso).orElse(MediaType.APPLICATION_OCTET_STREAM);
       return ResponseEntity.ok().contentType(tipo).body(recurso);
   }
}
