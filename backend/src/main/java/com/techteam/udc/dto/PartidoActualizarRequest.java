package com.techteam.udc.dto;

import java.time.LocalDateTime;

import com.techteam.udc.models.EstadoPartido;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record PartidoActualizarRequest(
		Long equipoLocalId,
		Long equipoVisitanteId,
		Long instalacionId,
		LocalDateTime fechaInicio,
		LocalDateTime fechaFin,
		@Min(1) @Max(12) Integer plazasArbitralesSolicitadas,
		EstadoPartido estado
) {}
