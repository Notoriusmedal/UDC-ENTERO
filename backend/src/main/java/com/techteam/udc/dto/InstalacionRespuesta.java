package com.techteam.udc.dto;

public record InstalacionRespuesta(
		Long id,
		String nombre,
		String ubicacionTexto,
		Double latitud,
		Double longitud
) {}
