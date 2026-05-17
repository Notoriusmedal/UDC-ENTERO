package com.techteam.udc.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.techteam.udc.dto.LoginRequest;
import com.techteam.udc.dto.LoginResponse;
import com.techteam.udc.dto.UsuarioActualResponse;
import com.techteam.udc.security.PrincipalUsuario;
import com.techteam.udc.security.jwt.JwtUtil;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthenticationManager authenticationManager;
	private final JwtUtil jwtUtil;

	public AuthController(AuthenticationManager authenticationManager, JwtUtil jwtUtil) {
		this.authenticationManager = authenticationManager;
		this.jwtUtil = jwtUtil;
	}

	@PostMapping("/login")
	public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest body) {
		var tokenSinAutenticar = UsernamePasswordAuthenticationToken.unauthenticated(
				body.username().trim(),
				body.password());
		var autenticado = authenticationManager.authenticate(tokenSinAutenticar);
		var principal = (PrincipalUsuario) autenticado.getPrincipal();
		String jwt = jwtUtil.generateToken(principal);
		return ResponseEntity.ok(new LoginResponse(
				jwt,
				jwtUtil.getExpiresInApproxMinutes(),
				principal.getUsername(),
				principal.getRol().name()));
	}

	@GetMapping("/me")
	public ResponseEntity<UsuarioActualResponse> yo(@AuthenticationPrincipal PrincipalUsuario principal) {
		var u = principal.getUsuario();
		return ResponseEntity.ok(new UsuarioActualResponse(
				u.getId(),
				u.getUsername(),
				u.getRol().name(),
				u.getNombre(),
				u.getApellidos(),
				u.getCorreo()));
	}
}
