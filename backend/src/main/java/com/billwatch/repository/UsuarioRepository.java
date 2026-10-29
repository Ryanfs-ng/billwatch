package com.billwatch.repository;

import com.billwatch.domain.Usuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    Optional<Usuario> findByEmail(String email);

    boolean existsByEmail(@NotBlank @Email String email);

    List<Usuario> findByGrupoIdOrderByNome(UUID grupoId);

    boolean existsByGrupoId(UUID grupoId);

    List<Usuario> findByResumoSemanalAtivoTrue();

    Optional<Usuario> findByResetTokenHash(String resetTokenHash);
}
