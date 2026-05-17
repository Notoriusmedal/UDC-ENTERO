package com.techteam.udc.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.techteam.udc.dto.PartidoCompatRequest;
import com.techteam.udc.dto.PartidoRespuesta;
import com.techteam.udc.models.EstadoPartido;
import com.techteam.udc.security.PrincipalUsuario;
import com.techteam.udc.services.PartidoService;

@RestController
@RequestMapping("/api/partidos")
public class PartidoController {

	private final PartidoService partidoService;

	public PartidoController(PartidoService partidoService) {
		this.partidoService = partidoService;
	}

	@GetMapping
	public List<PartidoRespuesta> listar(
			@RequestParam Map<String, String> params,
			@AuthenticationPrincipal PrincipalUsuario principal) {
		return filtrar(partidoService.listarVisible(principal.getUsuario()), params);
	}

	@GetMapping("/proximos")
	public List<PartidoRespuesta> proximos(@AuthenticationPrincipal PrincipalUsuario principal) {
		return partidoService.listarProximosVisible(principal.getUsuario());
	}

	@GetMapping("/{id}")
	public PartidoRespuesta obtener(
			@PathVariable Long id,
			@AuthenticationPrincipal PrincipalUsuario principal) {
		return partidoService.obtenerVisible(id, principal.getUsuario());
	}

	@PostMapping
	@PreAuthorize("hasRole('ADMIN') or hasRole('ORGANIZADOR')")
	public PartidoRespuesta crear(
			@RequestBody PartidoCompatRequest body,
			@AuthenticationPrincipal PrincipalUsuario principal) {
		return partidoService.crearCompat(body, principal.getUsuario());
	}

	@PatchMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN') or hasRole('ORGANIZADOR')")
	public PartidoRespuesta actualizarParcial(
			@PathVariable Long id,
			@RequestBody PartidoCompatRequest body,
			@AuthenticationPrincipal PrincipalUsuario principal) {
		return partidoService.actualizarCompat(id, body, principal.getUsuario());
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN') or hasRole('ORGANIZADOR')")
	public PartidoRespuesta actualizar(
			@PathVariable Long id,
			@RequestBody PartidoCompatRequest body,
			@AuthenticationPrincipal PrincipalUsuario principal) {
		return partidoService.actualizarCompat(id, body, principal.getUsuario());
	}

	@DeleteMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN') or hasRole('ORGANIZADOR')")
	public void eliminar(
			@PathVariable Long id,
			@AuthenticationPrincipal PrincipalUsuario principal) {
		partidoService.eliminarCompat(id, principal.getUsuario());
	}

	private List<PartidoRespuesta> filtrar(List<PartidoRespuesta> partidos, Map<String, String> params) {
		String texto = params.getOrDefault("q", "").trim().toLowerCase();
		String estado = params.getOrDefault("estado", "").trim();
		String desde = params.getOrDefault("desde", "").trim();
		String hasta = params.getOrDefault("hasta", "").trim();
		return partidos.stream()
				.filter(p -> texto.isEmpty()
						|| contiene(p.equipoLocal(), texto)
						|| contiene(p.equipoVisitante(), texto)
						|| contiene(p.competicion(), texto)
						|| contiene(p.lugar(), texto))
				.filter(p -> estado.isEmpty() || p.estado() == EstadoPartido.valueOf(estado))
				.filter(p -> desde.isEmpty() || !p.fecha().toLocalDate().isBefore(java.time.LocalDate.parse(desde)))
				.filter(p -> hasta.isEmpty() || !p.fecha().toLocalDate().isAfter(java.time.LocalDate.parse(hasta)))
				.toList();
	}

	private boolean contiene(String valor, String texto) {
		return valor != null && valor.toLowerCase().contains(texto);
	}
}
