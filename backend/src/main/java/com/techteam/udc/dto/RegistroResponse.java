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

	public static RegistroResponse pendiente(String username, String rol) {
		return new RegistroResponse(
				"PENDIENTE_APROBACION",
				"Cuenta creada. Un administrador debe aprobarla antes de poder entrar.",
				"Bearer",
				null,
				0,
				username,
				rol);
	}
}
