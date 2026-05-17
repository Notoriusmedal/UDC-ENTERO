package com.techteam.udc.controllers;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.techteam.udc.dto.AsignacionOperacionRespuesta;
import com.techteam.udc.dto.AsignacionesReemplazoRequest;
import com.techteam.udc.dto.AsignacionRespuesta;
import com.techteam.udc.dto.AutoAsignacionRespuesta;
import com.techteam.udc.security.PrincipalUsuario;
import com.techteam.udc.services.AsignacionArbitralService;

import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/partidos/{partidoId}/asignaciones")
public class PartidoAsignacionesController {

	private final AsignacionArbitralService asignacionArbitralService;

	public PartidoAsignacionesController(AsignacionArbitralService asignacionArbitralService) {
		this.asignacionArbitralService = asignacionArbitralService;
	}

	@GetMapping
	public List<AsignacionRespuesta> listarActivas(
			@PathVariable Long partidoId,
			@AuthenticationPrincipal PrincipalUsuario principal) {
		return asignacionArbitralService.listarActivasDelPartido(partidoId, principal.getUsuario());
	}

	@PutMapping("/manual-completo")
	@PreAuthorize("hasRole('ADMIN') or hasRole('COORDINADOR_ARBITROS')")
	public AsignacionOperacionRespuesta reemplazoManual(
			@PathVariable Long partidoId,
			@Valid @RequestBody AsignacionesReemplazoRequest body,
			@AuthenticationPrincipal PrincipalUsuario principal) {
		return asignacionArbitralService.reemplazoManualCompleto(partidoId, body, principal.getUsuario());
	}

	@PostMapping("/auto")
	@PreAuthorize("hasRole('ADMIN') or hasRole('COORDINADOR_ARBITROS')")
	public AutoAsignacionRespuesta auto(
			@PathVariable Long partidoId,
			@AuthenticationPrincipal PrincipalUsuario principal) {
		return asignacionArbitralService.autoAsignacion(partidoId, principal.getUsuario());
	}
}
