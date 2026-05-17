package com.techteam.udc.repositories;

import org.springframework.data.jpa.repository.JpaRepository;

import com.techteam.udc.models.Instalacion;

import java.util.Optional;

public interface InstalacionRepository extends JpaRepository<Instalacion, Long> {

	Optional<Instalacion> findFirstByNombreIgnoreCase(String nombre);
}
