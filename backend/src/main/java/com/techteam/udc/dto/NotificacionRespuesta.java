package com.techteam.udc.dto;

import java.time.Instant;

import com.techteam.udc.models.TipoNotificacion;

public record NotificacionRespuesta(
		Long id,
		TipoNotificacion tipo,
		String titulo,
		String mensaje,
		Long partidoId,
		boolean leida,
		Instant creadoEn
) {}
