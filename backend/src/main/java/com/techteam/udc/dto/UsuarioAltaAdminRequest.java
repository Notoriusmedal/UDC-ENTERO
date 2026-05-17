package com.techteam.udc.dto;

import com.techteam.udc.models.Rol;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UsuarioAltaAdminRequest(
		@NotBlank @Size(max = 64) String username,
		@NotBlank @Size(min = 6, max = 120) String passwordClaro,
		@NotBlank @Size(max = 120) String nombre,
		@NotBlank @Size(max = 120) String apellidos,
		@NotBlank @Email @Size(max = 180) String correo,
		@NotBlank @Size(max = 32) String documentoIdentidad,
		@NotBlank @Size(max = 40) String telefono,
		@NotNull Rol rol,
		boolean convocableParaSeleccionArbitral
) {}
