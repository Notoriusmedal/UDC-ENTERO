package com.techteam.udc.dto;

import jakarta.validation.constraints.NotNull;

public record ConvocablePatchRequest(@NotNull Boolean convocable) {}
