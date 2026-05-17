package com.techteam.udc.repositories;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.techteam.udc.models.Rol;
import com.techteam.udc.models.Usuario;

import java.util.List;

// Usuarios para login y CRUD administracion
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

	Optional<Usuario> findByUsername(String username);

	boolean existsByUsernameOrCorreoOrDocumentoIdentidad(String username, String correo, String documentoIdentidad);

	long countByRol(Rol rol);

	boolean existsByDocumentoIdentidad(String documentoIdentidad);

	boolean existsByCorreo(String correo);

	boolean existsByUsername(String username);

	List<Usuario> findByRol(Rol rol);

	boolean existsByCorreoAndIdNot(String correo, Long id);
}
