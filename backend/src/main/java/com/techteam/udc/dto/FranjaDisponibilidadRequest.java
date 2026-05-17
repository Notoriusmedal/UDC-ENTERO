package com.techteam.udc.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;

public record FranjaDisponibilidadRequest(
		@NotNull LocalDateTime inicio,
		@NotNull LocalDateTime fin
) {}
