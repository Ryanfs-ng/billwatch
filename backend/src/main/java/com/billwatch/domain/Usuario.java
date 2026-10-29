package com.billwatch.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "usuarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nome;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String senha;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column
    private String resetTokenHash;

    @Column
    private Instant resetTokenExpira;

    @ManyToOne
    @JoinColumn(name = "grupo_id")
    private Grupo grupo;

    public boolean podeVer(Usuario outro) {
        return id.equals(outro.getId())
                || (grupo != null && outro.getGrupo() != null && grupo.getId().equals(outro.getGrupo().getId()));
    }

    @PrePersist
    void aoPersistir() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
