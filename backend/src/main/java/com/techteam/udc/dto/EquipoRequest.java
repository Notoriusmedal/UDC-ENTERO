package com.techteam.udc.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EquipoRequest(
		@NotBlank @Size(max = 160) String nombre,
		@Size(max = 500) String escudoEtiqueta
) {}
