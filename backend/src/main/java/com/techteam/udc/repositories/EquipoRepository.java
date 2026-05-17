package com.techteam.udc.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.techteam.udc.models.Equipo;

import java.util.Optional;

public interface EquipoRepository extends JpaRepository<Equipo, Long> {

	boolean existsByNombreIgnoreCase(String nombre);

	Optional<Equipo> findByNombreIgnoreCase(String nombre);
}
