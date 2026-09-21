package com.billwatch.repository;

import com.billwatch.domain.Boleto;
import com.billwatch.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BoletoRepository extends JpaRepository<Boleto, UUID> {
    List<Boleto> findByResponsavelEmail(String email);

}
