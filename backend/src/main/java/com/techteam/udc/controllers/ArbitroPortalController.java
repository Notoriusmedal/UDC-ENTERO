package com.techteam.udc.controllers;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.techteam.udc.dto.AsignacionRespuesta;
import com.techteam.udc.dto.FranjaDisponibilidadRespuesta;
import com.techteam.udc.dto.FranjasReemplazoRequest;
import com.techteam.udc.security.PrincipalUsuario;
import com.techteam.udc.services.AsignacionArbitralService;
import com.techteam.udc.services.FranjaConvocatoriaService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/arbitro")
@PreAuthorize("hasRole('ARBITRO')")
public class ArbitroPortalController {

	private final FranjaConvocatoriaService franjaConvocatoriaService;
	private final AsignacionArbitralService asignacionArbitralService;

	public ArbitroPortalController(
			FranjaConvocatoriaService franjaConvocatoriaService,
			AsignacionArbitralService asignacionArbitralService) {
		this.franjaConvocatoriaService = franjaConvocatoriaService;
		this.asignacionArbitralService = asignacionArbitralService;
	}

	@GetMapping("/franjas")
	public List<FranjaDisponibilidadRespuesta> misFranjas(@AuthenticationPrincipal PrincipalUsuario principal) {
		return franjaConvocatoriaService.listarPropias(principal.getUsuario());
	}

	@PutMapping("/franjas")
	public List<FranjaDisponibilidadRespuesta> reemplazarFranjas(
			@Valid @RequestBody FranjasReemplazoRequest body,
			@AuthenticationPrincipal PrincipalUsuario principal) {
		return franjaConvocatoriaService.reemplazarPropias(principal.getUsuario(), body.franjas());
	}

	@GetMapping("/asignaciones/historial")
	public List<AsignacionRespuesta> historial(@AuthenticationPrincipal PrincipalUsuario principal) {
		return asignacionArbitralService.historialArbitroCompleto(principal.getUsuario());
	}
}
