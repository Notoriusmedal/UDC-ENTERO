package com.techteam.udc.dto;

import java.util.List;

public record AsignacionOperacionRespuesta(
		List<AsignacionRespuesta> asignaciones,
		List<String> advertencias
) {}
