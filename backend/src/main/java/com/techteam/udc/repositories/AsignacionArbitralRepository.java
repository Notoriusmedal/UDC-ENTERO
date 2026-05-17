package com.techteam.udc.repositories;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.techteam.udc.models.AsignacionArbitral;
import com.techteam.udc.models.Partido;
import com.techteam.udc.models.Usuario;

public interface AsignacionArbitralRepository extends JpaRepository<AsignacionArbitral, Long> {

	List<AsignacionArbitral> findByPartidoAndRevocadaFalse(Partido partido);

	List<AsignacionArbitral> findByPartido_IdAndRevocadaFalse(Long partidoId);

	List<AsignacionArbitral> findByPartido_Id(Long partidoId);

	List<AsignacionArbitral> findByRevocadaFalseOrderByCreadoEnDesc();

	List<AsignacionArbitral> findByArbitroOrderByCreadoEnDesc(Usuario arbitro);

	List<AsignacionArbitral> findByArbitro_IdAndRevocadaFalse(Long arbitroId);

	boolean existsByArbitroAndPartido_IdAndRevocadaFalse(Usuario arbitro, Long partidoId);

	List<AsignacionArbitral> findByArbitro_IdInAndRevocadaFalse(Collection<Long> arbitroIds);

	List<AsignacionArbitral> findByArbitroAndRevocadaFalse(Usuario arbitro);

	boolean existsByPartido_IdAndRevocadaFalseAndPosicionEnCampoIgnoreCase(Long partidoId, String posicion);

	long countByArbitro_IdAndRevocadaFalse(Long arbitroId);

	boolean existsByArbitro_IdAndPartido_Id(Long arbitroId, Long partidoId);
}
