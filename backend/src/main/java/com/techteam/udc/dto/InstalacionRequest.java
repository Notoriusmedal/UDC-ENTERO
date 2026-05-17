package com.techteam.udc.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InstalacionRequest(
		@NotBlank @Size(max = 200) String nombre,
		@Size(max = 500) String ubicacionTexto,
		Double latitud,
		Double longitud
) {}
