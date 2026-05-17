package com.techteam.udc.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record PartidoCrearRequest(
		@NotNull Long equipoLocalId,
		@NotNull Long equipoVisitanteId,
		@NotNull Long instalacionId,
		@NotNull LocalDateTime fechaInicio,
		LocalDateTime fechaFin,
		@Min(1) @Max(12) Integer plazasArbitralesSolicitadas,
		Long organizadorIdOpcionalCuandoLlamaAdministrador
) {}
