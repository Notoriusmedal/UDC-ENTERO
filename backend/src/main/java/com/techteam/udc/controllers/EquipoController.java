package com.techteam.udc.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.techteam.udc.dto.EquipoRequest;
import com.techteam.udc.dto.EquipoRespuesta;
import com.techteam.udc.services.EquipoService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/catalogo/equipos")
public class EquipoController {

	private final EquipoService equipoService;

	public EquipoController(EquipoService equipoService) {
		this.equipoService = equipoService;
	}

	@GetMapping
	public List<EquipoRespuesta> listar() {
		return equipoService.listar();
	}

	@PostMapping
	@PreAuthorize("hasRole('ADMIN')")
	public EquipoRespuesta crear(@Valid @RequestBody EquipoRequest body) {
		return equipoService.crear(body);
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public EquipoRespuesta actualizar(@PathVariable Long id, @Valid @RequestBody EquipoRequest body) {
		return equipoService.actualizar(id, body);
	}
}
