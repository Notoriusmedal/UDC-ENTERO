package com.techteam.udc.dto;

public record RegistroResponse(
		String estado,
		String mensaje,
		String tokenType,
		String accessToken,
		long expiresInMinutes,
		String username,
		String rol
) {

	public static RegistroResponse activo(LoginResponse login) {
		return new RegistroResponse(
				"ACTIVO",
				"Cuenta creada correctamente",
				login.tokenType(),
				login.accessToken(),
				login.expiresInMinutes(),
				login.username(),
				login.rol());
	}
}
