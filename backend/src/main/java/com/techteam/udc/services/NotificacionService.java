package com.techteam.udc.services;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.techteam.udc.dto.NotificacionRespuesta;
import com.techteam.udc.errores.RecursoNoEncontradoException;
import com.techteam.udc.models.Notificacion;
import com.techteam.udc.models.Partido;
import com.techteam.udc.models.Rol;
import com.techteam.udc.models.TipoNotificacion;
import com.techteam.udc.models.Usuario;
import com.techteam.udc.repositories.NotificacionRepository;
import com.techteam.udc.repositories.UsuarioRepository;

@Service
@Transactional
public class NotificacionService {

	private final NotificacionRepository notificacionRepository;
	private final UsuarioRepository usuarioRepository;

	public NotificacionService(
			NotificacionRepository notificacionRepository,
			UsuarioRepository usuarioRepository) {
		this.notificacionRepository = notificacionRepository;
		this.usuarioRepository = usuarioRepository;
	}

	public void notificarCoordinadoresCanchaLista(Partido partido) {
		String titulo = "Cancha lista para coordinación arbitral";
		String mensaje = String.format(
				"El partido %s vs %s en %s está listo para asignar árbitros.",
				partido.getEquipoLocal().getNombre(),
				partido.getEquipoVisitante().getNombre(),
				partido.getInstalacion().getNombre());
		for (Usuario coo : usuarioRepository.findByRol(Rol.COORDINADOR_ARBITROS)) {
			if (!coo.isEnabled()) {
				continue;
			}
			notificacionRepository.save(new Notificacion(
					coo,
					TipoNotificacion.CANCHA_PARA_COORDINACION_ARBITRAL,
					titulo,
					mensaje,
					partido));
		}
	}

	public void notificarArbitroAsignacion(Usuario arbitro, Partido partido, String posicion) {
		String titulo = "Nueva asignación arbitral";
		String mensaje = String.format(
				"Te asignaron al partido %s vs %s (%s) como %s.",
				partido.getEquipoLocal().getNombre(),
				partido.getEquipoVisitante().getNombre(),
				partido.getInstalacion().getNombre(),
				posicion);
		notificacionRepository.save(new Notificacion(
				arbitro,
				TipoNotificacion.ASIGNACION_ARBITRAL,
				titulo,
				mensaje,
				partido));
	}

	@Transactional(readOnly = true)
	public List<NotificacionRespuesta> misNotificaciones(Usuario usuario) {
		return notificacionRepository.findByDestinatario_IdOrderByCreadoEnDesc(usuario.getId()).stream()
				.map(this::mapear)
				.toList();
	}

	public NotificacionRespuesta marcarLeida(Long notificacionId, Usuario destinatario) {
		Notificacion n = notificacionRepository.findById(notificacionId)
				.orElseThrow(() -> new RecursoNoEncontradoException("Notificación no encontrada"));
		if (!n.getDestinatario().getId().equals(destinatario.getId())) {
			throw new RecursoNoEncontradoException("Notificación no encontrada");
		}
		n.setLeida(true);
		return mapear(n);
	}

	private NotificacionRespuesta mapear(Notificacion n) {
		return new NotificacionRespuesta(
				n.getId(),
				n.getTipo(),
				n.getTitulo(),
				n.getMensaje(),
				n.getPartido() != null ? n.getPartido().getId() : null,
				n.isLeida(),
				n.getCreadoEn());
	}
}
