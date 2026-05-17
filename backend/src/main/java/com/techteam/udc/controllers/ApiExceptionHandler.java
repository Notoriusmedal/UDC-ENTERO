package com.techteam.udc.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.techteam.udc.dto.ErrorResponse;
import com.techteam.udc.errores.ProhibidoOperacionException;
import com.techteam.udc.errores.RecursoNoEncontradoException;
import com.techteam.udc.errores.ReglaNegocioException;

@RestControllerAdvice
public class ApiExceptionHandler {

	@ExceptionHandler(BadCredentialsException.class)
	public ResponseEntity<ErrorResponse> credencialesInvalidas() {
		return ResponseEntity.status(401)
				.body(new ErrorResponse("CREDENCIALES_INVALIDAS", "Usuario o contraseña incorrectos"));
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ErrorResponse> accesoDenegado() {
		return ResponseEntity.status(403)
				.body(new ErrorResponse("PROHIBIDO", "No tienes permiso para esta operación"));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErrorResponse> validacion(MethodArgumentNotValidException ex) {
		String msg = ex.getBindingResult().getFieldErrors().stream()
				.map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
				.findFirst()
				.orElse("Datos inválidos");
		return ResponseEntity.badRequest().body(new ErrorResponse("VALIDACION", msg));
	}

	@ExceptionHandler(RecursoNoEncontradoException.class)
	public ResponseEntity<ErrorResponse> noEncontrado(RecursoNoEncontradoException ex) {
		return ResponseEntity.status(404).body(new ErrorResponse("NO_ENCONTRADO", ex.getMessage()));
	}

	@ExceptionHandler(ReglaNegocioException.class)
	public ResponseEntity<ErrorResponse> regla(ReglaNegocioException ex) {
		return ResponseEntity.badRequest().body(new ErrorResponse("REGLA_NEGOCIO", ex.getMessage()));
	}

	@ExceptionHandler(ProhibidoOperacionException.class)
	public ResponseEntity<ErrorResponse> prohibidoOp(ProhibidoOperacionException ex) {
		return ResponseEntity.status(403).body(new ErrorResponse("OPERACION_PROHIBIDA", ex.getMessage()));
	}
}
