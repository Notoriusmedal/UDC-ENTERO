package com.techteam.udc.dto;

public record LoginResponse(String tokenType, String accessToken, long expiresInMinutes, String username, String rol) {

	public LoginResponse(String accessToken, long expiresInMinutes, String username, String rol) {
		this("Bearer", accessToken, expiresInMinutes, username, rol);
	}
}
