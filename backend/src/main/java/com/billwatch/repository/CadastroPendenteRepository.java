package com.billwatch.repository;

import com.billwatch.domain.CadastroPendente;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface CadastroPendenteRepository extends JpaRepository<CadastroPendente, UUID> {
    Optional<CadastroPendente> findByEmail(String email);

    Optional<CadastroPendente> findByTokenHash(String tokenHash);

    void deleteByExpiraEmBefore(Instant limite);
}
