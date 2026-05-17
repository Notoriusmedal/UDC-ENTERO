package com.techteam.udc.dto;

public record UsuarioActualResponse(
		Long id,
		String username,
		String rol,
		String nombre,
		String apellidos,
		String correo
) {}
