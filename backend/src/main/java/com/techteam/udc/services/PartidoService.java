package com.techteam.udc.services;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.techteam.udc.dto.PartidoActualizarRequest;
import com.techteam.udc.dto.PartidoCompatRequest;
import com.techteam.udc.dto.PartidoCrearRequest;
import com.techteam.udc.dto.PartidoRespuesta;
import com.techteam.udc.errores.ProhibidoOperacionException;
import com.techteam.udc.errores.RecursoNoEncontradoException;
import com.techteam.udc.errores.ReglaNegocioException;
import com.techteam.udc.models.AsignacionArbitral;
import com.techteam.udc.models.Equipo;
import com.techteam.udc.models.EstadoPartido;
import com.techteam.udc.models.Instalacion;
import com.techteam.udc.models.Partido;
import com.techteam.udc.models.Rol;
import com.techteam.udc.models.Usuario;
import com.techteam.udc.repositories.AsignacionArbitralRepository;
import com.techteam.udc.repositories.EquipoRepository;
import com.techteam.udc.repositories.InstalacionRepository;
import com.techteam.udc.repositories.PartidoRepository;
import com.techteam.udc.repositories.UsuarioRepository;
import com.techteam.udc.util.TiempoPartidoUtil;

@Service
@Transactional
public class PartidoService {

	private static final Set<EstadoPartido> IGNORA_SOLAPE = EnumSet.of(
			EstadoPartido.CANCELADO,
			EstadoPartido.FINALIZADO);

	private final PartidoRepository partidoRepository;
	private final UsuarioRepository usuarioRepository;
	private final EquipoService equipoService;
	private final InstalacionService instalacionService;
	private final NotificacionService notificacionService;
	private final AsignacionArbitralRepository asignacionArbitralRepository;
	private final EquipoRepository equipoRepository;
	private final InstalacionRepository instalacionRepository;

	public PartidoService(
			PartidoRepository partidoRepository,
			UsuarioRepository usuarioRepository,
			EquipoService equipoService,
			InstalacionService instalacionService,
			NotificacionService notificacionService,
			AsignacionArbitralRepository asignacionArbitralRepository,
			EquipoRepository equipoRepository,
			InstalacionRepository instalacionRepository) {
		this.partidoRepository = partidoRepository;
		this.usuarioRepository = usuarioRepository;
		this.equipoService = equipoService;
		this.instalacionService = instalacionService;
		this.notificacionService = notificacionService;
		this.asignacionArbitralRepository = asignacionArbitralRepository;
		this.equipoRepository = equipoRepository;
		this.instalacionRepository = instalacionRepository;
	}

	public PartidoRespuesta crear(PartidoCrearRequest req, Usuario solicitante) {
		validarCreacionPorRol(solicitante.getRol());
		Usuario organizador = resolverOrganizadorAlCrear(req, solicitante);
		Equipo local = equipoService.obtenerEntidad(req.equipoLocalId());
		Equipo visitante = equipoService.obtenerEntidad(req.equipoVisitanteId());
		if (local.getId().equals(visitante.getId())) {
			throw new ReglaNegocioException("El equipo local y visitante deben ser distintos");
		}
		Instalacion instalacion = instalacionService.obtenerEntidad(req.instalacionId());
		validarVentanaTemporal(req.fechaInicio(), req.fechaFin());
		LocalDateTime finVentanaParaSolapes = calcularFinVentana(req.fechaInicio(), req.fechaFin());
		assertSinSolapeInstalacion(null, instalacion.getId(), req.fechaInicio(), finVentanaParaSolapes);
		int plazas = req.plazasArbitralesSolicitadas() != null ? req.plazasArbitralesSolicitadas() : 3;
		Partido p = new Partido(
				local,
				visitante,
				instalacion,
				organizador,
				req.fechaInicio(),
				req.fechaFin(),
				EstadoPartido.PROGRAMADO,
				plazas);
		partidoRepository.save(p);
		return mapear(p);
	}

	public PartidoRespuesta crearCompat(PartidoCompatRequest req, Usuario solicitante) {
		validarCreacionPorRol(solicitante.getRol());
		Usuario organizador = resolverOrganizadorAlCrearCompat(req, solicitante);
		Equipo local = resolverEquipo(req.equipoLocalId(), req.equipoLocal(), "Equipo local");
		Equipo visitante = resolverEquipo(req.equipoVisitanteId(), req.equipoVisitante(), "Equipo visitante");
		if (local.getId().equals(visitante.getId())) {
			throw new ReglaNegocioException("El equipo local y visitante deben ser distintos");
		}
		Instalacion instalacion = resolverInstalacion(req.instalacionId(), req.lugar());
		LocalDateTime inicio = resolverFechaInicio(req);
		validarVentanaTemporal(inicio, req.fechaFin());
		LocalDateTime finVentanaParaSolapes = calcularFinVentana(inicio, req.fechaFin());
		assertSinSolapeInstalacion(null, instalacion.getId(), inicio, finVentanaParaSolapes);
		int plazas = resolverPlazas(req);
		Partido p = new Partido(
				local,
				visitante,
				instalacion,
				organizador,
				inicio,
				req.fechaFin(),
				req.estado() != null ? req.estado() : EstadoPartido.PROGRAMADO,
				plazas);
		aplicarCamposFrontend(p, req);
		partidoRepository.save(p);
		return mapear(p);
	}

	public PartidoRespuesta actualizar(Long partidoId, PartidoActualizarRequest req, Usuario solicitante) {
		Partido p = partidoRepository.findById(partidoId)
				.orElseThrow(() -> new RecursoNoEncontradoException("Partido no encontrado"));
		assertPuedeGestionar(solicitante, p);
		LocalDateTime nuevoInicio = req.fechaInicio() != null ? req.fechaInicio() : p.getFechaInicio();
		LocalDateTime nuevoFinDeclarado = req.fechaFin() != null ? req.fechaFin() : p.getFechaFin();
		validarVentanaTemporal(nuevoInicio, nuevoFinDeclarado);
		Instalacion instalacion = p.getInstalacion();
		if (req.instalacionId() != null) {
			instalacion = instalacionService.obtenerEntidad(req.instalacionId());
			p.setInstalacion(instalacion);
		}
		LocalDateTime finVentanaParaSolapes = calcularFinVentana(nuevoInicio, nuevoFinDeclarado);
		assertSinSolapeInstalacion(p.getId(), instalacion.getId(), nuevoInicio, finVentanaParaSolapes);

		if (req.equipoLocalId() != null) {
			p.setEquipoLocal(equipoService.obtenerEntidad(req.equipoLocalId()));
		}
		if (req.equipoVisitanteId() != null) {
			p.setEquipoVisitante(equipoService.obtenerEntidad(req.equipoVisitanteId()));
		}
		if (p.getEquipoLocal().getId().equals(p.getEquipoVisitante().getId())) {
			throw new ReglaNegocioException("El equipo local y visitante deben ser distintos");
		}
		p.setFechaInicio(nuevoInicio);
		p.setFechaFin(nuevoFinDeclarado);
		if (req.plazasArbitralesSolicitadas() != null) {
			p.setPlazasArbitralesSolicitadas(req.plazasArbitralesSolicitadas());
		}
		if (req.estado() != null) {
			EstadoPartido anterior = p.getEstado();
			p.setEstado(req.estado());
			if (anterior != EstadoPartido.CANCHA_ACTIVA && req.estado() == EstadoPartido.CANCHA_ACTIVA) {
				notificacionService.notificarCoordinadoresCanchaLista(p);
			}
		}
		return mapear(p);
	}

	public PartidoRespuesta actualizarCompat(Long partidoId, PartidoCompatRequest req, Usuario solicitante) {
		Partido p = partidoRepository.findById(partidoId)
				.orElseThrow(() -> new RecursoNoEncontradoException("Partido no encontrado"));
		assertPuedeGestionar(solicitante, p);

		LocalDateTime nuevoInicio = req.fechaInicio() != null ? req.fechaInicio()
				: req.fecha() != null ? req.fecha()
				: p.getFechaInicio();
		LocalDateTime nuevoFinDeclarado = req.fechaFin() != null ? req.fechaFin() : p.getFechaFin();
		validarVentanaTemporal(nuevoInicio, nuevoFinDeclarado);

		Instalacion instalacion = p.getInstalacion();
		if (req.instalacionId() != null || tieneTexto(req.lugar())) {
			instalacion = resolverInstalacion(req.instalacionId(), req.lugar());
			p.setInstalacion(instalacion);
		}

		LocalDateTime finVentanaParaSolapes = calcularFinVentana(nuevoInicio, nuevoFinDeclarado);
		assertSinSolapeInstalacion(p.getId(), instalacion.getId(), nuevoInicio, finVentanaParaSolapes);

		if (req.equipoLocalId() != null || tieneTexto(req.equipoLocal())) {
			p.setEquipoLocal(resolverEquipo(req.equipoLocalId(), req.equipoLocal(), "Equipo local"));
		}
		if (req.equipoVisitanteId() != null || tieneTexto(req.equipoVisitante())) {
			p.setEquipoVisitante(resolverEquipo(req.equipoVisitanteId(), req.equipoVisitante(), "Equipo visitante"));
		}
		if (p.getEquipoLocal().getId().equals(p.getEquipoVisitante().getId())) {
			throw new ReglaNegocioException("El equipo local y visitante deben ser distintos");
		}

		p.setFechaInicio(nuevoInicio);
		p.setFechaFin(nuevoFinDeclarado);
		if (req.plazasArbitralesSolicitadas() != null || req.arbitrosRequeridos() != null) {
			p.setPlazasArbitralesSolicitadas(resolverPlazas(req));
		}
		if (req.estado() != null) {
			EstadoPartido anterior = p.getEstado();
			p.setEstado(req.estado());
			if (anterior != EstadoPartido.CANCHA_ACTIVA && req.estado() == EstadoPartido.CANCHA_ACTIVA) {
				notificacionService.notificarCoordinadoresCanchaLista(p);
			}
		}
		aplicarCamposFrontend(p, req);
		return mapear(p);
	}

	public void eliminarCompat(Long partidoId, Usuario solicitante) {
		Partido p = partidoRepository.findById(partidoId)
				.orElseThrow(() -> new RecursoNoEncontradoException("Partido no encontrado"));
		assertPuedeGestionar(solicitante, p);
		asignacionArbitralRepository.deleteAll(asignacionArbitralRepository.findByPartido_Id(partidoId));
		partidoRepository.delete(p);
	}

	@Transactional(readOnly = true)
	public PartidoRespuesta obtenerVisible(Long partidoId, Usuario visitante) {
		Partido p = partidoRepository.findById(partidoId)
				.orElseThrow(() -> new RecursoNoEncontradoException("Partido no encontrado"));
		assertPuedeVer(visitante, p);
		return mapear(p);
	}

	@Transactional(readOnly = true)
	public List<PartidoRespuesta> listarVisible(Usuario visitante) {
		return listarPartidosPermitidos(visitante).stream()
				.sorted(Comparator.comparing(Partido::getFechaInicio))
				.map(this::mapear)
				.toList();
	}

	@Transactional(readOnly = true)
	public List<PartidoRespuesta> listarProximosVisible(Usuario visitante) {
		LocalDateTime ahora = LocalDateTime.now().minusMinutes(1);
		return listarPartidosPermitidos(visitante).stream()
				.filter(p -> !IGNORA_SOLAPE.contains(p.getEstado()))
				.filter(p -> !p.getFechaInicio().isBefore(ahora))
				.sorted(Comparator.comparing(Partido::getFechaInicio))
				.map(this::mapear)
				.toList();
	}

	@Transactional(readOnly = true)
	public Partido obtenerEntidad(Long id) {
		return partidoRepository.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("Partido no encontrado"));
	}

	public void assertPuedeGestionar(Usuario usuario, Partido partido) {
		if (usuario.getRol() == Rol.ADMIN) {
			return;
		}
		if (usuario.getRol() == Rol.ORGANIZADOR
				&& partido.getOrganizador().getId().equals(usuario.getId())) {
			return;
		}
		throw new ProhibidoOperacionException("No puedes gestionar este partido");
	}

	public void assertCoordinaPartidoParaAsignar(Usuario usuario, Partido partido) {
		if (usuario.getRol() != Rol.COORDINADOR_ARBITROS && usuario.getRol() != Rol.ADMIN) {
			throw new ProhibidoOperacionException("Solo coordinación o administración puede asignar árbitros");
		}
		if (partido.getEstado() != EstadoPartido.CANCHA_ACTIVA) {
			throw new ReglaNegocioException("El partido debe estar en estado CANCHA_ACTIVA para asignar árbitros");
		}
	}

	public PartidoRespuesta mapear(Partido p) {
		int asignados = asignacionArbitralRepository.findByPartido_IdAndRevocadaFalse(p.getId()).size();
		return new PartidoRespuesta(
				p.getId(),
				p.getEquipoLocal().getNombre(),
				p.getEquipoVisitante().getNombre(),
				p.getInstalacion().getNombre(),
				p.getOrganizador().getUsername(),
				p.getFechaInicio(),
				TiempoPartidoUtil.finEfectivo(p),
				p.getEstado(),
				p.getPlazasArbitralesSolicitadas(),
				p.getEquipoLocal().getNombre(),
				p.getEquipoVisitante().getNombre(),
				p.getInstalacion().getNombre(),
				p.getFechaInicio(),
				p.getFechaFin(),
				p.getDeporte(),
				p.getCompeticion(),
				p.getObservaciones(),
				asignados,
				p.getPlazasArbitralesSolicitadas());
	}

	private void assertPuedeVer(Usuario usuario, Partido p) {
		switch (usuario.getRol()) {
			case ADMIN, COORDINADOR_ARBITROS -> {
				// sin filtro extra
			}
			case ORGANIZADOR -> {
				if (!p.getOrganizador().getId().equals(usuario.getId())) {
					throw new ProhibidoOperacionException("No puedes ver este partido");
				}
			}
			case ARBITRO -> {
				if (!asignacionArbitralRepository.existsByArbitro_IdAndPartido_Id(usuario.getId(), p.getId())) {
					throw new ProhibidoOperacionException("No puedes ver este partido");
				}
			}
		}
	}

	private List<Partido> listarPartidosPermitidos(Usuario visitante) {
		return switch (visitante.getRol()) {
			case ADMIN, COORDINADOR_ARBITROS -> partidoRepository.findAll();
			case ORGANIZADOR -> partidoRepository.findByOrganizador_Id(visitante.getId());
			case ARBITRO -> {
				Map<Long, Partido> porId = new LinkedHashMap<>();
				for (AsignacionArbitral a : asignacionArbitralRepository.findByArbitroOrderByCreadoEnDesc(visitante)) {
					Partido par = a.getPartido();
					porId.putIfAbsent(par.getId(), par);
				}
				yield List.copyOf(porId.values());
			}
		};
	}

	private Usuario resolverOrganizadorAlCrear(PartidoCrearRequest req, Usuario solicitante) {
		if (solicitante.getRol() == Rol.ADMIN) {
			Long oid = req.organizadorIdOpcionalCuandoLlamaAdministrador();
			if (oid == null) {
				throw new ReglaNegocioException(
						"El administrador debe indicar organizadorIdOpcionalCuandoLlamaAdministrador");
			}
			Usuario org = usuarioRepository.findById(oid)
					.orElseThrow(() -> new RecursoNoEncontradoException("Organizador no encontrado"));
			if (!org.isEnabled()) {
				throw new ReglaNegocioException("El organizador indicado está deshabilitado");
			}
			if (org.getRol() != Rol.ORGANIZADOR) {
				throw new ReglaNegocioException("El usuario indicado no es organizador");
			}
			return org;
		}
		if (solicitante.getRol() != Rol.ORGANIZADOR) {
			throw new ProhibidoOperacionException("No puedes crear partidos");
		}
		return solicitante;
	}

	private Usuario resolverOrganizadorAlCrearCompat(PartidoCompatRequest req, Usuario solicitante) {
		if (solicitante.getRol() == Rol.ADMIN) {
			Long oid = req.organizadorIdOpcionalCuandoLlamaAdministrador();
			if (oid != null) {
				Usuario org = usuarioRepository.findById(oid)
						.orElseThrow(() -> new RecursoNoEncontradoException("Organizador no encontrado"));
				if (org.getRol() != Rol.ORGANIZADOR || !org.isEnabled()) {
					throw new ReglaNegocioException("El usuario indicado no es un organizador activo");
				}
				return org;
			}
			return usuarioRepository.findByRol(Rol.ORGANIZADOR).stream()
					.filter(Usuario::isEnabled)
					.findFirst()
					.orElseThrow(() -> new ReglaNegocioException(
							"Necesitas al menos un usuario ORGANIZADOR para crear partidos como administrador"));
		}
		if (solicitante.getRol() != Rol.ORGANIZADOR) {
			throw new ProhibidoOperacionException("No puedes crear partidos");
		}
		return solicitante;
	}

	private Equipo resolverEquipo(Long id, String nombre, String etiqueta) {
		if (id != null) {
			return equipoService.obtenerEntidad(id);
		}
		String limpio = textoObligatorio(nombre, etiqueta);
		return equipoRepository.findByNombreIgnoreCase(limpio)
				.orElseGet(() -> equipoRepository.save(new Equipo(limpio, null)));
	}

	private Instalacion resolverInstalacion(Long id, String nombre) {
		if (id != null) {
			return instalacionService.obtenerEntidad(id);
		}
		String limpio = tieneTexto(nombre) ? nombre.trim() : "Instalación pendiente";
		return instalacionRepository.findFirstByNombreIgnoreCase(limpio)
				.orElseGet(() -> instalacionRepository.save(new Instalacion(limpio, limpio, null, null)));
	}

	private LocalDateTime resolverFechaInicio(PartidoCompatRequest req) {
		LocalDateTime fecha = req.fechaInicio() != null ? req.fechaInicio() : req.fecha();
		if (fecha == null) {
			throw new ReglaNegocioException("La fecha del partido es obligatoria");
		}
		return fecha;
	}

	private int resolverPlazas(PartidoCompatRequest req) {
		Integer plazas = req.plazasArbitralesSolicitadas() != null
				? req.plazasArbitralesSolicitadas()
				: req.arbitrosRequeridos();
		return plazas != null ? Math.max(1, plazas) : 3;
	}

	private void aplicarCamposFrontend(Partido p, PartidoCompatRequest req) {
		if (tieneTexto(req.deporte())) {
			p.setDeporte(req.deporte().trim().toUpperCase());
		}
		if (req.competicion() != null) {
			p.setCompeticion(req.competicion().trim());
		}
		if (req.observaciones() != null) {
			p.setObservaciones(req.observaciones().trim());
		}
	}

	private String textoObligatorio(String texto, String etiqueta) {
		if (!tieneTexto(texto)) {
			throw new ReglaNegocioException(etiqueta + " es obligatorio");
		}
		return texto.trim();
	}

	private boolean tieneTexto(String texto) {
		return texto != null && !texto.trim().isEmpty();
	}

	private void validarCreacionPorRol(Rol rol) {
		if (rol != Rol.ADMIN && rol != Rol.ORGANIZADOR) {
			throw new ProhibidoOperacionException("No puedes crear partidos");
		}
	}

	private void validarVentanaTemporal(LocalDateTime inicio, LocalDateTime finDecl) {
		if (finDecl != null && !finDecl.isAfter(inicio)) {
			throw new ReglaNegocioException("fechaFin debe ser posterior a fechaInicio");
		}
	}

	private LocalDateTime calcularFinVentana(LocalDateTime inicio, LocalDateTime finDecl) {
		return finDecl != null ? finDecl : inicio.plusHours(2);
	}

	private void assertSinSolapeInstalacion(Long excluirPartidoId, Long instalacionId,
			LocalDateTime ini, LocalDateTime finVentana) {
		for (Partido otro : partidoRepository.findByInstalacion_Id(instalacionId)) {
			if (excluirPartidoId != null && otro.getId().equals(excluirPartidoId)) {
				continue;
			}
			if (IGNORA_SOLAPE.contains(otro.getEstado())) {
				continue;
			}
			if (TiempoPartidoUtil.intervalosSeSolapan(
					ini,
					finVentana,
					otro.getFechaInicio(),
					TiempoPartidoUtil.finEfectivo(otro))) {
				throw new ReglaNegocioException("Ya hay otro partido usando esa instalación en ese horario");
			}
		}
	}
}
