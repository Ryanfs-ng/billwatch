package com.billwatch.repository;

import com.billwatch.domain.Grupo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GrupoRepository extends JpaRepository<Grupo, UUID> {
    Optional<Grupo> findByCodigoConvite(String codigoConvite);
}
