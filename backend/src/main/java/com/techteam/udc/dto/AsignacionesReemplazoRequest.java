package com.techteam.udc.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

public record AsignacionesReemplazoRequest(
		@NotEmpty @Valid List<AsignacionLineaRequest> asignaciones
) {}
