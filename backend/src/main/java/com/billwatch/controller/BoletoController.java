package com.billwatch.controller;

import com.billwatch.dto.BoletoRequest;
import com.billwatch.dto.BoletoResponse;
import com.billwatch.dto.DashboardResponse;
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

@RestController
@RequestMapping("/boletos")
@RequiredArgsConstructor
public class BoletoController {

    private final BoletoService boletoService;

    @GetMapping("/meus-boletos")
    public List<BoletoResponse> listarMeusBoletos(Authentication auth){
        return boletoService.listarMeusBoletos(auth.getName());
    }

    @GetMapping("/dashboard")
    public DashboardResponse dashboard(Authentication auth){
        return boletoService.dashboard(auth.getName());
    }

    @GetMapping
    public List<BoletoResponse> listarTodosBoletos(Authentication auth){
        return boletoService.listarTodosBoletos(auth.getName());
    }

   @PostMapping
   @ResponseStatus(HttpStatus.CREATED)
    public BoletoResponse criar (@Valid @RequestBody BoletoRequest boleto, Authentication auth){
        return boletoService.criar(boleto, auth.getName());
   }

   @PutMapping("/{id}")
   public BoletoResponse editar(@PathVariable UUID id, @Valid @RequestBody BoletoRequest dados, Authentication auth){
        return boletoService.editarBoleto(id, dados, auth.getName());
   }

   @PatchMapping("/{id}/pagar")
    public BoletoResponse pagar(@PathVariable UUID id, Authentication auth) {
        return boletoService.pagarBoleto(id, auth.getName());
   }

   @DeleteMapping("/{id}")
   @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar (@PathVariable UUID id, Authentication auth) throws IOException {
        boletoService.deletarBoleto(id, auth.getName());
   }

   @PutMapping(value = "/{id}/anexos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public BoletoResponse anexar (@PathVariable UUID id, @RequestParam("arquivo")MultipartFile arquivo, Authentication auth) throws IOException {
        return boletoService.anexar(id, arquivo, auth.getName());
   }

   @GetMapping("/{id}/anexo")
    public ResponseEntity<Resource> carregarAnexo(@PathVariable UUID id, Authentication auth) {
       Resource recurso = boletoService.carregarAnexo(id, auth.getName());
       MediaType tipo = MediaTypeFactory.getMediaType(recurso).orElse(MediaType.APPLICATION_OCTET_STREAM);
       return ResponseEntity.ok().contentType(tipo).body(recurso);
   }
}
