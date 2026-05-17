package com.techteam.udc.services;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.techteam.udc.dto.EquipoRequest;
import com.techteam.udc.dto.EquipoRespuesta;
import com.techteam.udc.errores.RecursoNoEncontradoException;
import com.techteam.udc.errores.ReglaNegocioException;
import com.techteam.udc.models.Equipo;
import com.techteam.udc.repositories.EquipoRepository;

@Service
@Transactional
public class EquipoService {

	private final EquipoRepository equipoRepository;

	public EquipoService(EquipoRepository equipoRepository) {
		this.equipoRepository = equipoRepository;
	}

	@Transactional(readOnly = true)
	public List<EquipoRespuesta> listar() {
		return equipoRepository.findAll().stream()
				.sorted(Comparator.comparing(Equipo::getNombre, String.CASE_INSENSITIVE_ORDER))
				.map(e -> new EquipoRespuesta(e.getId(), e.getNombre(), e.getEscudoEtiqueta()))
				.toList();
	}

	public EquipoRespuesta crear(EquipoRequest req) {
		String nombre = req.nombre().trim();
		if (equipoRepository.existsByNombreIgnoreCase(nombre)) {
			throw new ReglaNegocioException("Ya existe un equipo con ese nombre");
		}
		Equipo e = new Equipo(nombre, req.escudoEtiqueta() != null ? req.escudoEtiqueta().trim() : null);
		e = equipoRepository.save(e);
		return new EquipoRespuesta(e.getId(), e.getNombre(), e.getEscudoEtiqueta());
	}

	public EquipoRespuesta actualizar(Long id, EquipoRequest req) {
		Equipo e = equipoRepository.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("Equipo no encontrado"));
		String nombre = req.nombre().trim();
		equipoRepository.findByNombreIgnoreCase(nombre).ifPresent(otro -> {
			if (!otro.getId().equals(id)) {
				throw new ReglaNegocioException("Ya existe otro equipo con ese nombre");
			}
		});
		e.setNombre(nombre);
		e.setEscudoEtiqueta(req.escudoEtiqueta() != null ? req.escudoEtiqueta().trim() : null);
		return new EquipoRespuesta(e.getId(), e.getNombre(), e.getEscudoEtiqueta());
	}

	@Transactional(readOnly = true)
	public Equipo obtenerEntidad(Long id) {
		return equipoRepository.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("Equipo no encontrado"));
	}
}
