package com.techteam.udc.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AsignacionLineaRequest(
		@NotNull Long arbitroId,
		@NotBlank String posicionEnCampo
) {}
