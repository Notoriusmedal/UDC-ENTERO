package com.techteam.udc.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.techteam.udc.dto.LoginRequest;
import com.techteam.udc.dto.LoginResponse;
import com.techteam.udc.dto.RegistroRequest;
import com.techteam.udc.dto.UsuarioActualResponse;
import com.techteam.udc.errores.ReglaNegocioException;
import com.techteam.udc.models.Rol;
import com.techteam.udc.models.Usuario;
import com.techteam.udc.repositories.UsuarioRepository;
import com.techteam.udc.security.PrincipalUsuario;
import com.techteam.udc.security.jwt.JwtUtil;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthenticationManager authenticationManager;
	private final JwtUtil jwtUtil;
	private final UsuarioRepository usuarioRepository;
	private final PasswordEncoder passwordEncoder;

	public AuthController(
			AuthenticationManager authenticationManager,
			JwtUtil jwtUtil,
			UsuarioRepository usuarioRepository,
			PasswordEncoder passwordEncoder) {
		this.authenticationManager = authenticationManager;
		this.jwtUtil = jwtUtil;
		this.usuarioRepository = usuarioRepository;
		this.passwordEncoder = passwordEncoder;
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

	@PostMapping("/register")
	public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegistroRequest body) {
		Rol rol = body.rol();
		if (rol != Rol.ORGANIZADOR && rol != Rol.ARBITRO) {
			throw new ReglaNegocioException("Solo se permite registrar organizadores o árbitros");
		}

		String username = body.username().trim();
		String correo = body.correo().trim().toLowerCase();
		String documento = body.documentoIdentidad().trim();

		if (usuarioRepository.existsByUsername(username)) {
			throw new ReglaNegocioException("El nombre de usuario ya existe");
		}
		if (usuarioRepository.existsByCorreo(correo)) {
			throw new ReglaNegocioException("El correo ya existe");
		}
		if (usuarioRepository.existsByDocumentoIdentidad(documento)) {
			throw new ReglaNegocioException("El documento de identidad ya existe");
		}

		Usuario usuario = new Usuario(
				username,
				passwordEncoder.encode(body.password()),
				body.nombre().trim(),
				body.apellidos().trim(),
				correo,
				documento,
				body.telefono().trim(),
				rol,
				true,
				rol == Rol.ARBITRO);

		usuario = usuarioRepository.save(usuario);
		var principal = new PrincipalUsuario(usuario);
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
