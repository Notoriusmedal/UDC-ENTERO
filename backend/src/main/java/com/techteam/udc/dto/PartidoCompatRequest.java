package com.techteam.udc.dto;

import java.time.LocalDateTime;

import com.techteam.udc.models.EstadoPartido;

public record PartidoCompatRequest(
		Long equipoLocalId,
		Long equipoVisitanteId,
		Long instalacionId,
		Long organizadorIdOpcionalCuandoLlamaAdministrador,
		LocalDateTime fechaInicio,
		LocalDateTime fechaFin,
		Integer plazasArbitralesSolicitadas,
		String equipoLocal,
		String equipoVisitante,
		String lugar,
		LocalDateTime fecha,
		String deporte,
		String competicion,
		String observaciones,
		Integer arbitrosRequeridos,
		EstadoPartido estado
) {}
