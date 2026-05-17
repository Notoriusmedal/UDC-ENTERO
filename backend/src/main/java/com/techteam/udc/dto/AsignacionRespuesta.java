package com.techteam.udc.dto;

import java.time.Instant;

public record AsignacionRespuesta(
		Long id,
		Long partidoId,
		Long arbitroId,
		String arbitroUsername,
		String posicionEnCampo,
		String asignadoPorUsername,
		Instant creadoEn,
		boolean revocada
) {}
