package com.techteam.udc.dto;

import com.techteam.udc.models.Rol;

public record UsuarioListaRespuesta(
		Long id,
		String username,
		String nombre,
		String apellidos,
		String correo,
		Rol rol,
		boolean enabled,
		boolean convocableParaSeleccionArbitral
) {}
