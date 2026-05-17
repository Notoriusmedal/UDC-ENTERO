package com.techteam.udc.services;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.OptionalDouble;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.techteam.udc.dto.AsignacionLineaRequest;
import com.techteam.udc.dto.AsignacionOperacionRespuesta;
import com.techteam.udc.dto.AsignacionRespuesta;
import com.techteam.udc.dto.AsignacionesReemplazoRequest;
import com.techteam.udc.dto.AutoAsignacionRespuesta;
import com.techteam.udc.errores.ProhibidoOperacionException;
import com.techteam.udc.errores.RecursoNoEncontradoException;
import com.techteam.udc.errores.ReglaNegocioException;
import com.techteam.udc.models.AsignacionArbitral;
import com.techteam.udc.models.EstadoPartido;
import com.techteam.udc.models.Instalacion;
import com.techteam.udc.models.Partido;
import com.techteam.udc.models.Rol;
import com.techteam.udc.models.Usuario;
import com.techteam.udc.repositories.AsignacionArbitralRepository;
import com.techteam.udc.repositories.FranjaConvocatoriaRepository;
import com.techteam.udc.repositories.UsuarioRepository;
import com.techteam.udc.util.HaversineKm;
import com.techteam.udc.util.TiempoPartidoUtil;

@Service
@Transactional
public class AsignacionArbitralService {

	private final AsignacionArbitralRepository asignacionRepository;
	private final FranjaConvocatoriaRepository franjaRepository;
	private final UsuarioRepository usuarioRepository;
	private final PartidoService partidoService;
	private final NotificacionService notificacionService;

	@Value("${udc.business.kilometros-aviso-lejania-mismo-dia:60}")
	private double kilometrosAvisoLejania;

	public AsignacionArbitralService(
			AsignacionArbitralRepository asignacionRepository,
			FranjaConvocatoriaRepository franjaRepository,
			UsuarioRepository usuarioRepository,
			PartidoService partidoService,
			NotificacionService notificacionService) {
		this.asignacionRepository = asignacionRepository;
		this.franjaRepository = franjaRepository;
		this.usuarioRepository = usuarioRepository;
		this.partidoService = partidoService;
		this.notificacionService = notificacionService;
	}

	@Transactional(readOnly = true)
	public List<AsignacionRespuesta> listarActivasDelPartido(Long partidoId, Usuario visitante) {
		Partido p = partidoService.obtenerEntidad(partidoId);
		assertCoordinacion(visitante.getRol());
		partidoService.obtenerVisible(partidoId, visitante); // misma regla que ver detalle segun rol
		return asignacionRepository.findByPartido_IdAndRevocadaFalse(partidoId).stream()
				.map(this::mapear)
				.toList();
	}

	public AsignacionOperacionRespuesta reemplazoManualCompleto(
			Long partidoId,
			AsignacionesReemplazoRequest req,
			Usuario coordinador) {
		Partido partido = partidoService.obtenerEntidad(partidoId);
		partidoService.assertCoordinaPartidoParaAsignar(coordinador, partido);

		LocalDateTime ini = partido.getFechaInicio();
		LocalDateTime finEf = TiempoPartidoUtil.finEfectivo(partido);
		int esperadas = partido.getPlazasArbitralesSolicitadas();

		if (req.asignaciones().size() != esperadas) {
			throw new ReglaNegocioException(
					"Debes enviar exactamente " + esperadas + " líneas de asignación para este partido");
		}

		Set<Long> idsArbitro = new LinkedHashSet<>();
		Set<String> posNorm = new LinkedHashSet<>();
		for (AsignacionLineaRequest linea : req.asignaciones()) {
			if (!idsArbitro.add(linea.arbitroId())) {
				throw new ReglaNegocioException("No puedes repetir el mismo árbitro en el partido");
			}
			if (!posNorm.add(normPos(linea.posicionEnCampo()))) {
				throw new ReglaNegocioException("Las posiciones en campo deben ser distintas");
			}
		}

		List<Usuario> arbitros = new ArrayList<>();
		for (AsignacionLineaRequest linea : req.asignaciones()) {
			arbitros.add(obtenerArbitroElegible(linea.arbitroId()));
		}

		revocarActivas(partidoId);

		for (int i = 0; i < req.asignaciones().size(); i++) {
			String pos = req.asignaciones().get(i).posicionEnCampo().trim();
			validarArbitroTemporalmente(arbitros.get(i), partido, ini, finEf, pos);
		}

		List<AsignacionArbitral> guardadas = new ArrayList<>();
		for (int i = 0; i < req.asignaciones().size(); i++) {
			AsignacionLineaRequest linea = req.asignaciones().get(i);
			Usuario arbitro = arbitros.get(i);
			AsignacionArbitral a = new AsignacionArbitral(
					partido,
					arbitro,
					linea.posicionEnCampo().trim(),
					coordinador);
			guardadas.add(asignacionRepository.save(a));
			notificacionService.notificarArbitroAsignacion(arbitro, partido, linea.posicionEnCampo().trim());
		}

		List<String> advertencias = acumularAvisosLejania(guardadas, partido);

		List<AsignacionRespuesta> resp = guardadas.stream().map(this::mapear).toList();
		return new AsignacionOperacionRespuesta(resp, advertencias);
	}

	public AutoAsignacionRespuesta autoAsignacion(Long partidoId, Usuario coordinador) {
		Partido partido = partidoService.obtenerEntidad(partidoId);
		partidoService.assertCoordinaPartidoParaAsignar(coordinador, partido);

		LocalDateTime ini = partido.getFechaInicio();
		LocalDateTime finEf = TiempoPartidoUtil.finEfectivo(partido);
		List<AsignacionArbitral> actuales = asignacionRepository.findByPartido_IdAndRevocadaFalse(partidoId);
		int esperadas = partido.getPlazasArbitralesSolicitadas();

		List<String> advertenciasInicio = new ArrayList<>();
		if (actuales.size() >= esperadas) {
			advertenciasInicio.add("El partido ya tiene todas las plazas cubiertas");
			return new AutoAsignacionRespuesta(
					actuales.stream().map(this::mapear).toList(),
					advertenciasInicio);
		}

		Set<String> posUsadasNorm = actuales.stream()
				.map(a -> normPos(a.getPosicionEnCampo()))
				.collect(Collectors.toCollection(LinkedHashSet::new));
		Set<Long> arbitrosYa = actuales.stream()
				.map(a -> a.getArbitro().getId())
				.collect(Collectors.toCollection(LinkedHashSet::new));

		List<Usuario> base = usuarioRepository.findByRol(Rol.ARBITRO).stream()
				.filter(Usuario::isEnabled)
				.filter(Usuario::isConvocableParaSeleccionArbitral)
				.sorted(Comparator.comparingLong(u -> asignacionRepository.countByArbitro_IdAndRevocadaFalse(u.getId())))
				.toList();

		int vacantes = esperadas - actuales.size();
		List<AsignacionArbitral> todas = new ArrayList<>(actuales);
		List<AsignacionArbitral> creadasEnEstaEjecucion = new ArrayList<>();

		for (int v = 0; v < vacantes; v++) {
			String pos = siguienteNombrePosicionLibre(esperadas, posUsadasNorm);
			posUsadasNorm.add(normPos(pos));

			Usuario picked = null;
			for (Usuario c : base) {
				if (arbitrosYa.contains(c.getId())) {
					continue;
				}
				if (!cubreFranja(c.getId(), ini, finEf)) {
					continue;
				}
				if (tieneSolapeConOtrosPartidos(c.getId(), ini, finEf, partido.getId())) {
					continue;
				}
				picked = c;
				break;
			}
			if (picked == null) {
				advertenciasInicio.add("No hubo árbitro válido disponible para la posición \"" + pos + "\"");
				continue;
			}
			AsignacionArbitral nueva = new AsignacionArbitral(partido, picked, pos, coordinador);
			nueva = asignacionRepository.save(nueva);
			todas.add(nueva);
			creadasEnEstaEjecucion.add(nueva);
			arbitrosYa.add(picked.getId());
			notificacionService.notificarArbitroAsignacion(picked, partido, pos);
		}

		advertenciasInicio.addAll(acumularAvisosLejania(creadasEnEstaEjecucion, partido));

		List<AsignacionRespuesta> resp = todas.stream().map(this::mapear).toList();
		return new AutoAsignacionRespuesta(resp, advertenciasInicio);
	}

	@Transactional(readOnly = true)
	public List<AsignacionRespuesta> historialArbitroCompleto(Usuario arbitro) {
		if (arbitro.getRol() != Rol.ARBITRO) {
			throw new ProhibidoOperacionException("Historial sólo disponible para árbitros");
		}
		return asignacionRepository.findByArbitroOrderByCreadoEnDesc(arbitro).stream()
				.map(this::mapear)
				.toList();
	}

	private void assertCoordinacion(Rol rol) {
		if (rol != Rol.ADMIN && rol != Rol.COORDINADOR_ARBITROS) {
			throw new ProhibidoOperacionException("Sólo coordinación o administración pueden consultar estas asignaciones");
		}
	}

	private Usuario obtenerArbitroElegible(Long id) {
		Usuario u = usuarioRepository.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Árbitro no encontrado"));
		if (u.getRol() != Rol.ARBITRO) {
			throw new ReglaNegocioException("El usuario seleccionado no es árbitro");
		}
		if (!u.isEnabled()) {
			throw new ReglaNegocioException("El árbitro está deshabilitado");
		}
		if (!u.isConvocableParaSeleccionArbitral()) {
			throw new ReglaNegocioException("El árbitro no está marcado como convocable");
		}
		return u;
	}

	private void validarArbitroTemporalmente(Usuario arbitro, Partido partido, LocalDateTime ini, LocalDateTime finEf,
			String posLimpio) {
		assertFranjaCubre(arbitro.getId(), ini, finEf);
		Long pid = Objects.requireNonNull(partido.getId());
		if (asignacionRepository.existsByPartido_IdAndRevocadaFalseAndPosicionEnCampoIgnoreCase(pid, posLimpio)) {
			throw new ReglaNegocioException("La posición en campo \"" + posLimpio + "\" ya está ocupada");
		}
		if (tieneSolapeConOtrosPartidos(arbitro.getId(), ini, finEf, pid)) {
			throw new ReglaNegocioException("El árbitro ya tiene otro partido solapado en ese horario");
		}
	}

	private boolean cubreFranja(Long arbitroId, LocalDateTime ini, LocalDateTime finEf) {
		return franjaRepository.findByArbitro_IdOrderByInicioAsc(arbitroId).stream().anyMatch(
				f -> TiempoPartidoUtil.intervalosSeSolapan(f.getInicio(), f.getFin(), ini, finEf));
	}

	private void assertFranjaCubre(Long arbitroId, LocalDateTime ini, LocalDateTime finEf) {
		if (!cubreFranja(arbitroId, ini, finEf)) {
			throw new ReglaNegocioException("El árbitro no tiene una franja de disponibilidad que cubra todo el partido");
		}
	}

	private boolean tieneSolapeConOtrosPartidos(Long arbitroId, LocalDateTime ini, LocalDateTime finEf,
			Long excluirPartidoId) {
		for (AsignacionArbitral a : asignacionRepository.findByArbitro_IdAndRevocadaFalse(arbitroId)) {
			Partido p2 = a.getPartido();
			if (p2.getId().equals(excluirPartidoId)) {
				continue;
			}
			if (EstadoPartido.CANCELADO.equals(p2.getEstado()) || EstadoPartido.FINALIZADO.equals(p2.getEstado())) {
				continue;
			}
			if (TiempoPartidoUtil.intervalosSeSolapan(
					ini,
					finEf,
					p2.getFechaInicio(),
					TiempoPartidoUtil.finEfectivo(p2))) {
				return true;
			}
		}
		return false;
	}

	private void revocarActivas(Long partidoId) {
		asignacionRepository.findByPartido_IdAndRevocadaFalse(partidoId)
				.forEach(a -> a.setRevocada(true));
	}

	private String siguienteNombrePosicionLibre(int plazas, Set<String> usadasYaNorm) {
		List<String> plantilla = etiquetasPorPlazas(plazas);
		for (String s : plantilla) {
			if (!usadasYaNorm.contains(normPos(s))) {
				return s;
			}
		}
		int idx = plantilla.size() + 1;
		while (true) {
			String extra = "Posición " + idx;
			if (!usadasYaNorm.contains(normPos(extra))) {
				return extra;
			}
			idx++;
		}
	}

	private List<String> etiquetasPorPlazas(int plazas) {
		List<String> res = new ArrayList<>();
		if (plazas >= 1) {
			res.add("Árbitro principal");
		}
		if (plazas >= 2) {
			res.add("Primer asistente");
		}
		if (plazas >= 3) {
			res.add("Segundo asistente");
		}
		for (int i = 4; i <= plazas; i++) {
			res.add("Oficial adicional " + (i - 3));
		}
		return res;
	}

	private String normPos(String s) {
		return s.toLowerCase(Locale.ROOT).trim();
	}

	private List<String> acumularAvisosLejania(List<AsignacionArbitral> grupo, Partido centro) {
		Instalacion i0 = centro.getInstalacion();
		List<String> out = new ArrayList<>();

		Set<String> vistas = new HashSet<>();
		for (AsignacionArbitral a : grupo) {
			for (AsignacionArbitral ot : asignacionRepository.findByArbitro_IdAndRevocadaFalse(a.getArbitro().getId())) {
				Partido otroPar = ot.getPartido();
				if (otroPar.getId().equals(centro.getId())) {
					continue;
				}
				if (EstadoPartido.CANCELADO.equals(otroPar.getEstado())
						|| EstadoPartido.FINALIZADO.equals(otroPar.getEstado())) {
					continue;
				}
				if (!TiempoPartidoUtil.mismoDiaCalendario(centro.getFechaInicio(), otroPar.getFechaInicio())) {
					continue;
				}
				Instalacion i2 = otroPar.getInstalacion();
				OptionalDouble km = HaversineKm.entre(
						i0.getLatitud(), i0.getLongitud(),
						i2.getLatitud(), i2.getLongitud());
				if (km.isPresent() && km.getAsDouble() > kilometrosAvisoLejania) {
					String clave = a.getArbitro().getId()
							+ "#"
							+ Math.min(centro.getId(), otroPar.getId())
							+ "#"
							+ Math.max(centro.getId(), otroPar.getId());
					if (vistas.add(clave)) {
						out.add(String.format(Locale.ROOT,
								"Aviso distancia (%s ↔ %s, ~%.0f km el mismo día) para árbitro %s.",
								centro.getEquipoLocal().getNombre(),
								otroPar.getEquipoLocal().getNombre(),
								km.getAsDouble(),
								a.getArbitro().getUsername()));
					}
				}
			}
		}
		return out;
	}

	private AsignacionRespuesta mapear(AsignacionArbitral a) {
		return new AsignacionRespuesta(
				a.getId(),
				a.getPartido().getId(),
				a.getArbitro().getId(),
				a.getArbitro().getUsername(),
				a.getPosicionEnCampo(),
				a.getAsignadoPor().getUsername(),
				a.getCreadoEn(),
				a.isRevocada());
	}
}
