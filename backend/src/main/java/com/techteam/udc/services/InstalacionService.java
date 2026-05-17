package com.techteam.udc.services;

import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.techteam.udc.dto.InstalacionRequest;
import com.techteam.udc.dto.InstalacionRespuesta;
import com.techteam.udc.errores.RecursoNoEncontradoException;
import com.techteam.udc.models.Instalacion;
import com.techteam.udc.repositories.InstalacionRepository;

@Service
@Transactional
public class InstalacionService {

	private final InstalacionRepository instalacionRepository;

	public InstalacionService(InstalacionRepository instalacionRepository) {
		this.instalacionRepository = instalacionRepository;
	}

	@Transactional(readOnly = true)
	public List<InstalacionRespuesta> listar() {
		return instalacionRepository.findAll().stream()
				.sorted(Comparator.comparing(Instalacion::getNombre, String.CASE_INSENSITIVE_ORDER))
				.map(this::mapear)
				.toList();
	}

	public InstalacionRespuesta crear(InstalacionRequest req) {
		Instalacion i = new Instalacion(
				req.nombre().trim(),
				req.ubicacionTexto() != null ? req.ubicacionTexto().trim() : null,
				req.latitud(),
				req.longitud());
		i = instalacionRepository.save(i);
		return mapear(i);
	}

	public InstalacionRespuesta actualizar(Long id, InstalacionRequest req) {
		Instalacion i = instalacionRepository.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("Instalación no encontrada"));
		i.setNombre(req.nombre().trim());
		i.setUbicacionTexto(req.ubicacionTexto() != null ? req.ubicacionTexto().trim() : null);
		i.setLatitud(req.latitud());
		i.setLongitud(req.longitud());
		return mapear(i);
	}

	@Transactional(readOnly = true)
	public Instalacion obtenerEntidad(Long id) {
		return instalacionRepository.findById(id)
				.orElseThrow(() -> new RecursoNoEncontradoException("Instalación no encontrada"));
	}

	private InstalacionRespuesta mapear(Instalacion i) {
		return new InstalacionRespuesta(
				i.getId(),
				i.getNombre(),
				i.getUbicacionTexto(),
				i.getLatitud(),
				i.getLongitud());
	}
}
