package com.techteam.udc.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.techteam.udc.models.EstadoPartido;
import com.techteam.udc.models.Partido;

public interface PartidoRepository extends JpaRepository<Partido, Long> {

	List<Partido> findByOrganizador_Id(Long organizadorId);

	List<Partido> findByInstalacion_Id(Long instalacionId);

	long countByInstalacion_IdAndEstadoNotIn(Long instalacionId, List<EstadoPartido> estados);

	List<Partido> findByEstado(EstadoPartido estado);
}
