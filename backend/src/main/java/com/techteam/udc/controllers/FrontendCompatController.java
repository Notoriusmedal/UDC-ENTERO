package com.techteam.udc.controllers;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.techteam.udc.errores.ProhibidoOperacionException;
import com.techteam.udc.errores.RecursoNoEncontradoException;
import com.techteam.udc.errores.ReglaNegocioException;
import com.techteam.udc.models.AsignacionArbitral;
import com.techteam.udc.models.EstadoPartido;
import com.techteam.udc.models.Partido;
import com.techteam.udc.models.Rol;
import com.techteam.udc.models.Usuario;
import com.techteam.udc.repositories.AsignacionArbitralRepository;
import com.techteam.udc.repositories.PartidoRepository;
import com.techteam.udc.repositories.UsuarioRepository;
import com.techteam.udc.security.PrincipalUsuario;
import com.techteam.udc.util.TiempoPartidoUtil;

@RestController
@RequestMapping("/api")
@Transactional
public class FrontendCompatController {

	private final UsuarioRepository usuarioRepository;
	private final PartidoRepository partidoRepository;
	private final AsignacionArbitralRepository asignacionRepository;
	private final PasswordEncoder passwordEncoder;

	public FrontendCompatController(
			UsuarioRepository usuarioRepository,
			PartidoRepository partidoRepository,
			AsignacionArbitralRepository asignacionRepository,
			@Qualifier("miPEcontraseñaApp") PasswordEncoder passwordEncoder) {
		this.usuarioRepository = usuarioRepository;
		this.partidoRepository = partidoRepository;
		this.asignacionRepository = asignacionRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@GetMapping("/arbitros")
	@PreAuthorize("hasRole('ADMIN') or hasRole('COORDINADOR_ARBITROS')")
	@Transactional(readOnly = true)
	public List<ArbitroResponse> listarArbitros(@RequestParam Map<String, String> params) {
		String texto = params.getOrDefault("q", "").trim().toLowerCase(Locale.ROOT);
		String disponibilidad = normalizar(params.get("disponibilidad"));
		String categoria = normalizar(params.get("categoria"));
		return usuarioRepository.findByRol(Rol.ARBITRO).stream()
				.filter(Usuario::isEnabled)
				.filter(u -> texto.isEmpty()
						|| contiene(u.getNombre(), texto)
						|| contiene(u.getApellidos(), texto)
						|| contiene(u.getCorreo(), texto)
						|| contiene(u.getDocumentoIdentidad(), texto))
				.filter(u -> disponibilidad.isEmpty() || normalizar(disponibilidadArbitro(u)).equals(disponibilidad))
				.filter(u -> categoria.isEmpty() || normalizar(categoriaArbitro(u)).equals(categoria))
				.map(this::mapArbitro)
				.toList();
	}

	@GetMapping("/arbitros/disponibles")
	@PreAuthorize("hasRole('ADMIN') or hasRole('COORDINADOR_ARBITROS')")
	@Transactional(readOnly = true)
	public List<ArbitroResponse> arbitrosDisponibles(@RequestParam(required = false) String fecha) {
		LocalDateTime momento = parseFecha(fecha);
		return usuarioRepository.findByRol(Rol.ARBITRO).stream()
				.filter(Usuario::isEnabled)
				.filter(u -> "DISPONIBLE".equals(normalizar(disponibilidadArbitro(u))))
				.filter(u -> momento == null || !tieneAsignacionEnMomento(u.getId(), momento))
				.map(this::mapArbitro)
				.toList();
	}

	@GetMapping("/arbitros/{id}")
	@PreAuthorize("hasRole('ADMIN') or hasRole('COORDINADOR_ARBITROS')")
	@Transactional(readOnly = true)
	public ArbitroResponse obtenerArbitro(@PathVariable Long id) {
		Usuario u = obtenerUsuario(id);
		if (u.getRol() != Rol.ARBITRO) {
			throw new RecursoNoEncontradoException("Árbitro no encontrado");
		}
		return mapArbitro(u);
	}

	@PostMapping("/arbitros")
	@PreAuthorize("hasRole('ADMIN') or hasRole('COORDINADOR_ARBITROS')")
	public ArbitroResponse crearArbitro(@RequestBody ArbitroRequest req) {
		String nombre = textoObligatorio(req.nombre(), "El nombre es obligatorio");
		String apellidos = textoObligatorio(req.apellidos(), "Los apellidos son obligatorios");
		String email = tieneTexto(req.email()) ? req.email().trim().toLowerCase(Locale.ROOT)
				: usernameBase(nombre, apellidos, null) + "@udc.dev";
		String documento = tieneTexto(req.dni()) ? req.dni().trim()
				: "ARB" + (usuarioRepository.count() + 1);

		if (usuarioRepository.existsByCorreo(email)) {
			throw new ReglaNegocioException("El correo ya existe");
		}
		if (usuarioRepository.existsByDocumentoIdentidad(documento)) {
			throw new ReglaNegocioException("El documento ya existe");
		}

		Usuario u = new Usuario(
				usernameUnico(usernameBase(nombre, apellidos, email)),
				passwordEncoder.encode("1234"),
				nombre,
				apellidos,
				email,
				documento,
				tieneTexto(req.telefono()) ? req.telefono().trim() : "000000000",
				Rol.ARBITRO,
				true,
				true);
		aplicarPerfilArbitro(u, req);
		u = usuarioRepository.save(u);
		return mapArbitro(u);
	}

	@PutMapping("/arbitros/{id}")
	@PreAuthorize("hasRole('ADMIN') or hasRole('COORDINADOR_ARBITROS')")
	public ArbitroResponse actualizarArbitro(@PathVariable Long id, @RequestBody ArbitroRequest req) {
		Usuario u = obtenerUsuario(id);
		if (u.getRol() != Rol.ARBITRO) {
			throw new RecursoNoEncontradoException("Árbitro no encontrado");
		}
		if (tieneTexto(req.nombre())) {
			u.setNombre(req.nombre().trim());
		}
		if (tieneTexto(req.apellidos())) {
			u.setApellidos(req.apellidos().trim());
		}
		if (tieneTexto(req.email())) {
			String email = req.email().trim().toLowerCase(Locale.ROOT);
			if (!email.equals(u.getCorreo()) && usuarioRepository.existsByCorreoAndIdNot(email, id)) {
				throw new ReglaNegocioException("El correo ya existe");
			}
			u.setCorreo(email);
		}
		if (tieneTexto(req.telefono())) {
			u.setTelefono(req.telefono().trim());
		}
		aplicarPerfilArbitro(u, req);
		return mapArbitro(u);
	}

	@DeleteMapping("/arbitros/{id}")
	@PreAuthorize("hasRole('ADMIN') or hasRole('COORDINADOR_ARBITROS')")
	public void eliminarArbitro(@PathVariable Long id) {
		Usuario u = obtenerUsuario(id);
		if (u.getRol() != Rol.ARBITRO) {
			throw new RecursoNoEncontradoException("Árbitro no encontrado");
		}
		u.setEnabled(false);
		u.setConvocableParaSeleccionArbitral(false);
		u.setDisponibilidadArbitral("NO_DISPONIBLE");
	}

	@PatchMapping("/arbitros/{id}/disponibilidad")
	@PreAuthorize("hasRole('ADMIN') or hasRole('COORDINADOR_ARBITROS')")
	public ArbitroResponse cambiarDisponibilidad(@PathVariable Long id, @RequestBody Map<String, String> body) {
		Usuario u = obtenerUsuario(id);
		if (u.getRol() != Rol.ARBITRO) {
			throw new RecursoNoEncontradoException("Árbitro no encontrado");
		}
		String estado = normalizar(body.getOrDefault("estado", "DISPONIBLE"));
		u.setDisponibilidadArbitral(estado);
		u.setConvocableParaSeleccionArbitral("DISPONIBLE".equals(estado) && u.isEnabled());
		return mapArbitro(u);
	}

	@GetMapping("/asignaciones")
	@Transactional(readOnly = true)
	public List<AsignacionFrontendResponse> listarAsignaciones(
			@RequestParam Map<String, String> params,
			@AuthenticationPrincipal PrincipalUsuario principal) {
		return asignacionesVisibles(principal.getUsuario()).stream()
				.filter(a -> filtraAsignacion(a, params))
				.map(this::mapAsignacion)
				.toList();
	}

	@GetMapping("/asignaciones/pendientes")
	@Transactional(readOnly = true)
	public List<AsignacionFrontendResponse> asignacionesPendientes(@AuthenticationPrincipal PrincipalUsuario principal) {
		return asignacionesVisibles(principal.getUsuario()).stream()
				.filter(a -> "PENDIENTE".equals(normalizar(a.getEstado())))
				.map(this::mapAsignacion)
				.toList();
	}

	@GetMapping("/asignaciones/{id}")
	@Transactional(readOnly = true)
	public AsignacionFrontendResponse obtenerAsignacion(
			@PathVariable Long id,
			@AuthenticationPrincipal PrincipalUsuario principal) {
		return asignacionesVisibles(principal.getUsuario()).stream()
				.filter(a -> a.getId().equals(id))
				.findFirst()
				.map(this::mapAsignacion)
				.orElseThrow(() -> new RecursoNoEncontradoException("Asignación no encontrada"));
	}

	@PostMapping("/asignaciones")
	@PreAuthorize("hasRole('ADMIN') or hasRole('COORDINADOR_ARBITROS')")
	public AsignacionFrontendResponse crearAsignacion(
			@RequestBody AsignacionRequest req,
			@AuthenticationPrincipal PrincipalUsuario principal) {
		Partido partido = partidoRepository.findById(req.partidoId())
				.orElseThrow(() -> new RecursoNoEncontradoException("Partido no encontrado"));
		Usuario arbitro = obtenerUsuario(req.arbitroId());
		if (arbitro.getRol() != Rol.ARBITRO || !arbitro.isEnabled()) {
			throw new ReglaNegocioException("El usuario seleccionado no es un árbitro activo");
		}
		boolean yaAsignado = asignacionRepository.findByPartido_IdAndRevocadaFalse(partido.getId()).stream()
				.anyMatch(a -> a.getArbitro().getId().equals(arbitro.getId()));
		if (yaAsignado) {
			throw new ReglaNegocioException("Este árbitro ya está asignado al partido");
		}
		if (tieneSolape(arbitro.getId(), partido)) {
			throw new ReglaNegocioException("El árbitro ya tiene otro partido solapado en ese horario");
		}
		AsignacionArbitral asignacion = new AsignacionArbitral(
				partido,
				arbitro,
				tieneTexto(req.rol()) ? req.rol().trim() : "Principal",
				principal.getUsuario());
		asignacion.setEstado("PENDIENTE");
		asignacion.setObservaciones(tieneTexto(req.observaciones()) ? req.observaciones().trim() : null);
		asignacion = asignacionRepository.save(asignacion);
		return mapAsignacion(asignacion);
	}

	@DeleteMapping("/asignaciones/{id}")
	@PreAuthorize("hasRole('ADMIN') or hasRole('COORDINADOR_ARBITROS')")
	public void eliminarAsignacion(@PathVariable Long id) {
		AsignacionArbitral a = obtenerAsignacionEntidad(id);
		a.setRevocada(true);
	}

	@PatchMapping("/asignaciones/{id}/confirmar")
	public AsignacionFrontendResponse confirmarAsignacion(
			@PathVariable Long id,
			@AuthenticationPrincipal PrincipalUsuario principal) {
		AsignacionArbitral a = obtenerAsignacionEntidad(id);
		assertPuedeResponder(principal.getUsuario(), a);
		a.setEstado("CONFIRMADO");
		return mapAsignacion(a);
	}

	@PatchMapping("/asignaciones/{id}/rechazar")
	public AsignacionFrontendResponse rechazarAsignacion(
			@PathVariable Long id,
			@AuthenticationPrincipal PrincipalUsuario principal) {
		AsignacionArbitral a = obtenerAsignacionEntidad(id);
		assertPuedeResponder(principal.getUsuario(), a);
		a.setEstado("RECHAZADO");
		return mapAsignacion(a);
	}

	@GetMapping("/dashboard/stats")
	@Transactional(readOnly = true)
	public Map<String, Object> dashboardStats(@AuthenticationPrincipal PrincipalUsuario principal) {
		Usuario usuario = principal.getUsuario();
		List<Partido> partidos = partidosVisibles(usuario);
		LocalDate hoy = LocalDate.now();
		LocalDate finSemana = hoy.plusDays(7);
		long partidosSemana = partidos.stream()
				.filter(p -> !p.getFechaInicio().toLocalDate().isBefore(hoy))
				.filter(p -> !p.getFechaInicio().toLocalDate().isAfter(finSemana))
				.filter(p -> p.getEstado() != EstadoPartido.CANCELADO)
				.count();
		List<Usuario> arbitros = usuarioRepository.findByRol(Rol.ARBITRO).stream()
				.filter(Usuario::isEnabled)
				.toList();
		long disponibles = arbitros.stream()
				.filter(a -> "DISPONIBLE".equals(normalizar(disponibilidadArbitro(a))))
				.count();
		long pendientes = asignacionesVisibles(usuario).stream()
				.filter(a -> "PENDIENTE".equals(normalizar(a.getEstado())))
				.count();
		return Map.of(
				"partidosSemana", partidosSemana,
				"partidosSemanaAnterior", 0,
				"arbitrosDisponibles", disponibles,
				"totalArbitros", arbitros.size(),
				"asignacionesPendientes", pendientes,
				"conflictos", 0);
	}

	@GetMapping("/dashboard/actividad")
	@Transactional(readOnly = true)
	public List<Object> dashboardActividad() {
		return List.of();
	}

	private List<AsignacionArbitral> asignacionesVisibles(Usuario usuario) {
		return asignacionRepository.findByRevocadaFalseOrderByCreadoEnDesc().stream()
				.filter(a -> switch (usuario.getRol()) {
					case ADMIN, COORDINADOR_ARBITROS -> true;
					case ORGANIZADOR -> a.getPartido().getOrganizador().getId().equals(usuario.getId());
					case ARBITRO -> a.getArbitro().getId().equals(usuario.getId());
				})
				.toList();
	}

	private List<Partido> partidosVisibles(Usuario usuario) {
		return partidoRepository.findAll().stream()
				.filter(p -> switch (usuario.getRol()) {
					case ADMIN, COORDINADOR_ARBITROS -> true;
					case ORGANIZADOR -> p.getOrganizador().getId().equals(usuario.getId());
					case ARBITRO -> asignacionRepository.existsByArbitro_IdAndPartido_Id(usuario.getId(), p.getId());
				})
				.toList();
	}

	private boolean filtraAsignacion(AsignacionArbitral a, Map<String, String> params) {
		String estado = normalizar(params.get("estado"));
		String desde = params.getOrDefault("desde", "").trim();
		String hasta = params.getOrDefault("hasta", "").trim();
		LocalDate fecha = a.getPartido().getFechaInicio().toLocalDate();
		return (estado.isEmpty() || normalizar(a.getEstado()).equals(estado))
				&& (desde.isEmpty() || !fecha.isBefore(LocalDate.parse(desde)))
				&& (hasta.isEmpty() || !fecha.isAfter(LocalDate.parse(hasta)));
	}

	private boolean tieneAsignacionEnMomento(Long arbitroId, LocalDateTime momento) {
		return asignacionRepository.findByArbitro_IdAndRevocadaFalse(arbitroId).stream()
				.filter(a -> !"RECHAZADO".equals(normalizar(a.getEstado())))
				.anyMatch(a -> mismoMinuto(a.getPartido().getFechaInicio(), momento));
	}

	private boolean tieneSolape(Long arbitroId, Partido partido) {
		LocalDateTime ini = partido.getFechaInicio();
		LocalDateTime fin = TiempoPartidoUtil.finEfectivo(partido);
		return asignacionRepository.findByArbitro_IdAndRevocadaFalse(arbitroId).stream()
				.filter(a -> !"RECHAZADO".equals(normalizar(a.getEstado())))
				.map(AsignacionArbitral::getPartido)
				.filter(p -> !Objects.equals(p.getId(), partido.getId()))
				.filter(p -> p.getEstado() != EstadoPartido.CANCELADO && p.getEstado() != EstadoPartido.FINALIZADO)
				.anyMatch(p -> TiempoPartidoUtil.intervalosSeSolapan(
						ini,
						fin,
						p.getFechaInicio(),
						TiempoPartidoUtil.finEfectivo(p)));
	}

	private void assertPuedeResponder(Usuario usuario, AsignacionArbitral asignacion) {
		if (usuario.getRol() == Rol.ADMIN || usuario.getRol() == Rol.COORDINADOR_ARBITROS) {
			return;
		}
		if (usuario.getRol() == Rol.ARBITRO && asignacion.getArbitro().getId().equals(usuario.getId())) {
			return;
		}
		throw new ProhibidoOperacionException("No puedes responder esta asignación");
	}

	private Usuario obtenerUsuario(Long id) {
		return usuarioRepository.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));
	}

	private AsignacionArbitral obtenerAsignacionEntidad(Long id) {
		return asignacionRepository.findById(id)
				.filter(a -> !a.isRevocada())
				.orElseThrow(() -> new RecursoNoEncontradoException("Asignación no encontrada"));
	}

	private ArbitroResponse mapArbitro(Usuario u) {
		return new ArbitroResponse(
				u.getId(),
				u.getNombre(),
				u.getApellidos(),
				u.getDocumentoIdentidad(),
				u.getTelefono(),
				u.getCorreo(),
				categoriaArbitro(u),
				u.getLicenciaArbitral(),
				disponibilidadArbitro(u),
				u.getObservacionesArbitro(),
				competenciasArbitro(u),
				asignacionRepository.countByArbitro_IdAndRevocadaFalse(u.getId()));
	}

	private AsignacionFrontendResponse mapAsignacion(AsignacionArbitral a) {
		Partido p = a.getPartido();
		Usuario arbitro = a.getArbitro();
		Usuario asignadoPor = a.getAsignadoPor();
		return new AsignacionFrontendResponse(
				a.getId(),
				new PartidoMiniResponse(
						p.getId(),
						p.getEquipoLocal().getNombre(),
						p.getEquipoVisitante().getNombre(),
						p.getCompeticion(),
						p.getFechaInicio(),
						p.getInstalacion().getNombre(),
						p.getDeporte()),
				new UsuarioMiniResponse(arbitro.getId(), arbitro.getNombre(), arbitro.getApellidos()),
				new UsuarioMiniResponse(asignadoPor.getId(), asignadoPor.getNombre(), asignadoPor.getApellidos()),
				a.getPosicionEnCampo(),
				a.getEstado(),
				a.getObservaciones(),
				p.getId(),
				arbitro.getId());
	}

	private void aplicarPerfilArbitro(Usuario u, ArbitroRequest req) {
		if (tieneTexto(req.categoria())) {
			u.setCategoriaArbitral(normalizar(req.categoria()));
		}
		if (req.licencia() != null) {
			u.setLicenciaArbitral(req.licencia().trim());
		}
		if (tieneTexto(req.disponibilidad())) {
			String disponibilidad = normalizar(req.disponibilidad());
			u.setDisponibilidadArbitral(disponibilidad);
			u.setConvocableParaSeleccionArbitral("DISPONIBLE".equals(disponibilidad) && u.isEnabled());
		}
		if (req.observaciones() != null) {
			u.setObservacionesArbitro(req.observaciones().trim());
		}
		if (req.competencias() != null) {
			u.setCompetenciasArbitrales(req.competencias().stream()
					.filter(this::tieneTexto)
					.map(this::normalizar)
					.distinct()
					.reduce((a, b) -> a + "," + b)
					.orElse("FUTBOL"));
		}
	}

	private List<String> competenciasArbitro(Usuario u) {
		String raw = u.getCompetenciasArbitrales();
		if (!tieneTexto(raw)) {
			return List.of("FUTBOL");
		}
		return Arrays.stream(raw.split(","))
				.map(String::trim)
				.filter(s -> !s.isEmpty())
				.toList();
	}

	private String categoriaArbitro(Usuario u) {
		return tieneTexto(u.getCategoriaArbitral()) ? u.getCategoriaArbitral() : "LOCAL";
	}

	private String disponibilidadArbitro(Usuario u) {
		if (!u.isEnabled()) {
			return "NO_DISPONIBLE";
		}
		return tieneTexto(u.getDisponibilidadArbitral()) ? u.getDisponibilidadArbitral() : "DISPONIBLE";
	}

	private String usernameBase(String nombre, String apellidos, String email) {
		if (tieneTexto(email) && email.contains("@")) {
			return slug(email.substring(0, email.indexOf('@')));
		}
		return slug(nombre + "." + apellidos);
	}

	private String usernameUnico(String base) {
		String limpio = tieneTexto(base) ? base : "arbitro";
		String candidato = limpio;
		int i = 2;
		while (usuarioRepository.existsByUsername(candidato)) {
			candidato = limpio + i++;
		}
		return candidato;
	}

	private String slug(String value) {
		String normalized = Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
				.replaceAll("\\p{M}", "");
		String out = normalized.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", ".");
		out = out.replaceAll("^\\.+|\\.+$", "");
		return out.isEmpty() ? "arbitro" : out;
	}

	private LocalDateTime parseFecha(String value) {
		if (!tieneTexto(value)) {
			return null;
		}
		String clean = value.trim();
		try {
			return LocalDateTime.parse(clean.length() > 19 ? clean.substring(0, 19) : clean);
		} catch (RuntimeException ex) {
			return null;
		}
	}

	private boolean mismoMinuto(LocalDateTime a, LocalDateTime b) {
		return a.withSecond(0).withNano(0).equals(b.withSecond(0).withNano(0));
	}

	private boolean contiene(String valor, String texto) {
		return valor != null && valor.toLowerCase(Locale.ROOT).contains(texto);
	}

	private String textoObligatorio(String texto, String mensaje) {
		if (!tieneTexto(texto)) {
			throw new ReglaNegocioException(mensaje);
		}
		return texto.trim();
	}

	private boolean tieneTexto(String texto) {
		return texto != null && !texto.trim().isEmpty();
	}

	private String normalizar(String value) {
		if (!tieneTexto(value)) {
			return "";
		}
		return Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
				.replaceAll("\\p{M}", "")
				.toUpperCase(Locale.ROOT)
				.replaceAll("[\\s-]+", "_");
	}

	public record ArbitroRequest(
			String nombre,
			String apellidos,
			String dni,
			String telefono,
			String email,
			String categoria,
			String licencia,
			String disponibilidad,
			String observaciones,
			List<String> competencias
	) {}

	public record ArbitroResponse(
			Long id,
			String nombre,
			String apellidos,
			String dni,
			String telefono,
			String email,
			String categoria,
			String licencia,
			String disponibilidad,
			String observaciones,
			List<String> competencias,
			long totalPartidos
	) {}

	public record AsignacionRequest(
			Long partidoId,
			Long arbitroId,
			String rol,
			String observaciones
	) {}

	public record PartidoMiniResponse(
			Long id,
			String equipoLocal,
			String equipoVisitante,
			String competicion,
			LocalDateTime fecha,
			String lugar,
			String deporte
	) {}

	public record UsuarioMiniResponse(
			Long id,
			String nombre,
			String apellidos
	) {}

	public record AsignacionFrontendResponse(
			Long id,
			PartidoMiniResponse partido,
			UsuarioMiniResponse arbitro,
			UsuarioMiniResponse asignadoPor,
			String rol,
			String estado,
			String observaciones,
			Long partidoId,
			Long arbitroId
	) {}
}
