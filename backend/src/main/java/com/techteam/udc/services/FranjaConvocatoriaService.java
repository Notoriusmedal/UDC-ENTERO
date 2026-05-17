package com.techteam.udc.services;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.techteam.udc.dto.FranjaDisponibilidadRequest;
import com.techteam.udc.dto.FranjaDisponibilidadRespuesta;
import com.techteam.udc.errores.ProhibidoOperacionException;
import com.techteam.udc.errores.ReglaNegocioException;
import com.techteam.udc.models.FranjaConvocatoria;
import com.techteam.udc.models.Rol;
import com.techteam.udc.models.Usuario;
import com.techteam.udc.repositories.FranjaConvocatoriaRepository;
import com.techteam.udc.util.TiempoPartidoUtil;

@Service
@Transactional
public class FranjaConvocatoriaService {

	private final FranjaConvocatoriaRepository franjaRepository;

	public FranjaConvocatoriaService(FranjaConvocatoriaRepository franjaRepository) {
		this.franjaRepository = franjaRepository;
	}

	@Transactional(readOnly = true)
	public List<FranjaDisponibilidadRespuesta> listarPropias(Usuario arbitro) {
		validarEsArbitro(arbitro);
		return franjaRepository.findByArbitro_IdOrderByInicioAsc(arbitro.getId()).stream()
				.map(f -> new FranjaDisponibilidadRespuesta(f.getId(), f.getInicio(), f.getFin()))
				.toList();
	}

	public List<FranjaDisponibilidadRespuesta> reemplazarPropias(
			Usuario arbitro,
			List<FranjaDisponibilidadRequest> franjas) {
		validarEsArbitro(arbitro);
		validarFranjas(franjas);
		franjaRepository.deleteByArbitro_Id(arbitro.getId());
		List<FranjaConvocatoria> nuevas = new ArrayList<>();
		for (FranjaDisponibilidadRequest fr : franjas) {
			nuevas.add(franjaRepository.save(new FranjaConvocatoria(arbitro, fr.inicio(), fr.fin())));
		}
		return nuevas.stream().map(f -> new FranjaDisponibilidadRespuesta(f.getId(), f.getInicio(), f.getFin())).toList();
	}

	private void validarEsArbitro(Usuario usuario) {
		if (usuario.getRol() != Rol.ARBITRO) {
			throw new ProhibidoOperacionException("Las franjas solo las gestiona un árbitro");
		}
		if (!usuario.isEnabled()) {
			throw new ReglaNegocioException("El usuario está deshabilitado");
		}
	}

	private void validarFranjas(List<FranjaDisponibilidadRequest> franjas) {
		List<FranjaDisponibilidadRequest> orden = franjas.stream()
				.sorted(Comparator.comparing(FranjaDisponibilidadRequest::inicio))
				.toList();
		for (int i = 0; i < orden.size(); i++) {
			var cur = orden.get(i);
			if (!cur.fin().isAfter(cur.inicio())) {
				throw new ReglaNegocioException("El fin debe ser posterior al inicio de cada franja");
			}
			if (i > 0) {
				var anterior = orden.get(i - 1);
				if (TiempoPartidoUtil.intervalosSeSolapan(anterior.inicio(), anterior.fin(), cur.inicio(), cur.fin())) {
					throw new ReglaNegocioException("Las franjas no pueden solaparse entre sí");
				}
			}
		}
	}
}
