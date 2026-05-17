package com.techteam.udc.controllers;

import java.util.List;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.techteam.udc.dto.NotificacionRespuesta;
import com.techteam.udc.security.PrincipalUsuario;
import com.techteam.udc.services.NotificacionService;

@RestController
@RequestMapping("/api/notificaciones")
public class MisNotificacionesController {

	private final NotificacionService notificacionService;

	public MisNotificacionesController(NotificacionService notificacionService) {
		this.notificacionService = notificacionService;
	}

	@GetMapping
	public List<NotificacionRespuesta> misNotificaciones(@AuthenticationPrincipal PrincipalUsuario principal) {
		return notificacionService.misNotificaciones(principal.getUsuario());
	}

	@PatchMapping("/{id}/leida")
	public NotificacionRespuesta marcarLeida(
			@PathVariable Long id,
			@AuthenticationPrincipal PrincipalUsuario principal) {
		return notificacionService.marcarLeida(id, principal.getUsuario());
	}
}
