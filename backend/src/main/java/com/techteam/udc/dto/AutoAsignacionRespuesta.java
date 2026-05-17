package com.techteam.udc.dto;

import java.util.List;

public record AutoAsignacionRespuesta(
		List<AsignacionRespuesta> asignaciones,
		List<String> advertencias
) {}
