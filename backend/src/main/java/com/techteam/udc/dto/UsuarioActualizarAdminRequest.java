package com.techteam.udc.dto;

import com.techteam.udc.models.Rol;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UsuarioActualizarAdminRequest(
		@Size(min = 6, max = 120) String passwordClaroOpcional,
		@Size(max = 120) String nombre,
		@Size(max = 120) String apellidos,
		@Email @Size(max = 180) String correo,
		@Size(max = 40) String telefono,
		Rol rol,
		Boolean enabled,
		Boolean convocableParaSeleccionArbitral
) {}
