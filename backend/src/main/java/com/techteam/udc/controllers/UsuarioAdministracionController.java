package com.techteam.udc.controllers;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.techteam.udc.dto.UsuarioActualizarAdminRequest;
import com.techteam.udc.dto.UsuarioAltaAdminRequest;
import com.techteam.udc.dto.UsuarioListaRespuesta;
import com.techteam.udc.services.UsuarioAdministracionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/usuarios")
public class UsuarioAdministracionController {

	private final UsuarioAdministracionService usuarioAdministracionService;

	public UsuarioAdministracionController(UsuarioAdministracionService usuarioAdministracionService) {
		this.usuarioAdministracionService = usuarioAdministracionService;
	}

	@GetMapping
	@PreAuthorize("hasRole('ADMIN')")
	public List<UsuarioListaRespuesta> listar() {
		return usuarioAdministracionService.listarTodos();
	}

	@PostMapping
	@PreAuthorize("hasRole('ADMIN')")
	public UsuarioListaRespuesta crear(@Valid @RequestBody UsuarioAltaAdminRequest body) {
		return usuarioAdministracionService.crear(body);
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public UsuarioListaRespuesta actualizar(
			@PathVariable Long id,
			@Valid @RequestBody UsuarioActualizarAdminRequest body) {
		return usuarioAdministracionService.actualizar(id, body);
	}
}
