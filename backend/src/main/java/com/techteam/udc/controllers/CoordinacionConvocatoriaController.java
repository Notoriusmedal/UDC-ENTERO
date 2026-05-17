package com.techteam.udc.controllers;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.techteam.udc.dto.ConvocablePatchRequest;
import com.techteam.udc.dto.UsuarioListaRespuesta;
import com.techteam.udc.security.PrincipalUsuario;
import com.techteam.udc.services.UsuarioAdministracionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/coordinacion/arbitros")
public class CoordinacionConvocatoriaController {

	private final UsuarioAdministracionService usuarioAdministracionService;

	public CoordinacionConvocatoriaController(UsuarioAdministracionService usuarioAdministracionService) {
		this.usuarioAdministracionService = usuarioAdministracionService;
	}

	@PatchMapping("/{id}/convocable")
	@PreAuthorize("hasRole('ADMIN') or hasRole('COORDINADOR_ARBITROS')")
	public UsuarioListaRespuesta convocable(
			@PathVariable Long id,
			@Valid @RequestBody ConvocablePatchRequest body,
			@AuthenticationPrincipal PrincipalUsuario principal) {
		return usuarioAdministracionService.establecerBanderaConvocatoria(id, body.convocable(), principal.getUsuario());
	}
}
