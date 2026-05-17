package com.techteam.udc.dto;

import java.time.LocalDateTime;

import com.techteam.udc.models.EstadoPartido;

public record PartidoRespuesta(
		Long id,
		String equipoLocalNombre,
		String equipoVisitanteNombre,
		String instalacionNombre,
		String organizadorUsername,
		LocalDateTime fechaInicio,
		LocalDateTime fechaFinEfectiva,
		EstadoPartido estado,
		int plazasArbitralesSolicitadas,
		String equipoLocal,
		String equipoVisitante,
		String lugar,
		LocalDateTime fecha,
		LocalDateTime fechaFin,
		String deporte,
		String competicion,
		String observaciones,
		int arbitrosAsignados,
		int arbitrosRequeridos
) {}
