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

import com.techteam.udc.dto.InstalacionRequest;
import com.techteam.udc.dto.InstalacionRespuesta;
import com.techteam.udc.services.InstalacionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/catalogo/instalaciones")
public class InstalacionController {

	private final InstalacionService instalacionService;

	public InstalacionController(InstalacionService instalacionService) {
		this.instalacionService = instalacionService;
	}

	@GetMapping
	public List<InstalacionRespuesta> listar() {
		return instalacionService.listar();
	}

	@PostMapping
	@PreAuthorize("hasRole('ADMIN')")
	public InstalacionRespuesta crear(@Valid @RequestBody InstalacionRequest body) {
		return instalacionService.crear(body);
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public InstalacionRespuesta actualizar(@PathVariable Long id, @Valid @RequestBody InstalacionRequest body) {
		return instalacionService.actualizar(id, body);
	}
}
